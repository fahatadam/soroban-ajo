import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { AppError } from '../errors/AppError'

const prisma = new PrismaClient()

const serializeBigInt = (data: unknown) =>
  JSON.parse(JSON.stringify(data, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))

export class GoalsController {
  createGoal = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.publicKey || req.body.userId
    if (!userId) throw new AppError('User ID is required', 'UNAUTHORIZED', 401)

    const { title, description, targetAmount, deadline, category, isPublic } = req.body

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        targetAmount: BigInt(targetAmount),
        deadline: new Date(deadline),
        category,
        isPublic: isPublic ?? false,
        userId,
        currentAmount: BigInt(0),
      },
    })

    res.status(201).json({ success: true, data: serializeBigInt(goal) })
  })

  getGoals = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.publicKey || req.query.userId
    if (!userId) throw new AppError('User ID is required', 'UNAUTHORIZED', 401)

    const goals = await prisma.goal.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: 'desc' },
    })

    res.status(200).json({ success: true, data: serializeBigInt(goals) })
  })

  getGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const goal = await prisma.goal.findUnique({ where: { id }, include: { members: true } })

    if (!goal) throw new AppError('Goal not found', 'NOT_FOUND', 404)

    res.status(200).json({ success: true, data: serializeBigInt(goal) })
  })

  updateGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    const { title, description, targetAmount, deadline, category, isPublic, status } = req.body

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetAmount !== undefined && { targetAmount: BigInt(targetAmount) }),
        ...(deadline !== undefined && { deadline: new Date(deadline) }),
        ...(category !== undefined && { category }),
        ...(isPublic !== undefined && { isPublic }),
        ...(status !== undefined && { status }),
      },
    })

    res.status(200).json({ success: true, data: serializeBigInt(goal) })
  })

  deleteGoal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params
    await prisma.goal.delete({ where: { id } })
    res.status(200).json({ success: true, message: 'Goal deleted successfully' })
  })

  checkAffordability = asyncHandler(async (req: Request, res: Response) => {
    const { monthlyIncome, monthlyExpenses, goalTarget, goalDeadline } = req.body

    const deadline = new Date(goalDeadline)
    const today = new Date()
    const monthsUntilDeadline =
      (deadline.getFullYear() - today.getFullYear()) * 12 +
      (deadline.getMonth() - today.getMonth())

    if (monthsUntilDeadline <= 0) {
      throw new AppError('Deadline must be in the future', 'VALIDATION_ERROR', 400)
    }

    const requiredMonthlySavings = goalTarget / monthsUntilDeadline
    const disposableIncome = monthlyIncome - monthlyExpenses

    let status: 'Sustainable' | 'Aggressive' | 'Unattainable'
    if (requiredMonthlySavings <= disposableIncome * 0.3) {
      status = 'Sustainable'
    } else if (requiredMonthlySavings <= disposableIncome * 0.6) {
      status = 'Aggressive'
    } else {
      status = 'Unattainable'
    }

    res.status(200).json({
      success: true,
      data: { status, requiredMonthlySavings, disposableIncome, monthsUntilDeadline },
    })
  })

  // Compound interest projection: A = P(1+r/n)^(nt) + PMT*(((1+r/n)^(nt)-1)/(r/n))
  calculateProjection = asyncHandler(async (req: Request, res: Response) => {
    const { principal, monthlyContribution, interestRate, years } = req.body

    const P = Number(principal)
    const PMT = Number(monthlyContribution)
    const r = Number(interestRate) / 100
    const t = Number(years)
    const n = 12

    const compoundInterest = P * Math.pow(1 + r / n, n * t)
    const futureValueContributions =
      r > 0 ? PMT * ((Math.pow(1 + r / n, n * t) - 1) / (r / n)) : PMT * n * t
    const totalAmount = compoundInterest + futureValueContributions

    res.status(200).json({
      success: true,
      data: {
        totalAmount,
        principal: P,
        totalContributions: PMT * n * t,
        interestEarned: totalAmount - P - PMT * n * t,
      },
    })
  })
}

export const goalsController = new GoalsController()
