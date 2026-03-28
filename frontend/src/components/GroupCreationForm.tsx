/**
 * @file GroupCreationForm.tsx
 * @description A multi-step form for creating new savings groups on the Soroban blockchain.
 * Handles form state, real-time validation, draft persistence, and blockchain mutation.
 */

import React, { useState, useRef, useEffect } from 'react'
import { useFormDraft } from '../hooks/useFormDraft'
import { useCreateGroup } from '../hooks/useContractData'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { StepIndicator } from './wizard/StepIndicator'
import { WizardStep } from './wizard/WizardStep'
import { GroupPreview } from './group/GroupPreview'

interface GroupFormData {
  groupName: string
  description: string
  cycleLength: number
  contributionAmount: number
  maxMembers: number
  frequency: 'weekly' | 'monthly'
  duration: number
  invitedMembers: string[]
}

interface FormErrors {
  groupName?: string
  description?: string
  cycleLength?: string
  contributionAmount?: string
  maxMembers?: string
}

/**
 * Properties for the GroupCreationForm component.
 */
interface GroupCreationFormProps {
  /** Optional callback triggered after successful group creation */
  onSuccess?: () => void
}

/**
 * A comprehensive form component for creating a new Ajo savings group.
 * Integrates with `useCreateGroup` for blockchain interaction and `useFormDraft`
 * for preserving user input across sessions.
 * 
 * @param props - Component properties
 * @returns {React.ReactElement} The rendered creation form
 */
export const GroupCreationForm: React.FC<GroupCreationFormProps> = ({ onSuccess }) => {
  const router = useRouter()
  const createGroupMutation = useCreateGroup()
  const [step, setStep] = useState(1)
  
  const [formData, setFormData] = useState<GroupFormData>({
    groupName: '',
    description: '',
    cycleLength: 30,
    contributionAmount: 100,
    maxMembers: 10,
    frequency: 'monthly',
    duration: 12,
    invitedMembers: [],
  })
  const [memberInput, setMemberInput] = useState('')

  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const groupNameRef = useRef<HTMLInputElement>(null)
  
  const loading = createGroupMutation.isPending
  
  const hasErrors = Object.keys(errors).length > 0

  const isDirty = Object.values(formData).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== '' && value !== 0
  })

  const { removeDraft } = useFormDraft({
    key: 'draft_group_creation',
    data: formData,
    onRestore: (draft) => setFormData(draft),
    enabled: isDirty,
  });

  // Focus on error summary when errors occur after submission
  useEffect(() => {
    if (submitted && Object.keys(errors).length > 0) {
      errorSummaryRef.current?.focus()
    }
  }, [errors, submitted])

  /**
   * Validates a single form field based on predefined rules.
   * 
   * @param name - The field name to validate
   * @param value - The current value of the field
   * @returns An error message string if invalid, otherwise undefined
   */
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'groupName':
        if (!value?.trim()) return 'Group name is required'
        if (value.trim().length < 3) return 'Group name must be at least 3 characters'
        if (value.trim().length > 100) return 'Group name must not exceed 100 characters'
        return undefined
      case 'description':
        if (value && value.length > 500) return 'Description must not exceed 500 characters'
        return undefined
      case 'cycleLength':
        if (!value) return 'Cycle length is required'
        if (value < 1) return 'Cycle length must be at least 1 day'
        if (value > 365) return 'Cycle length must not exceed 365 days'
        return undefined
      case 'contributionAmount':
        if (!value) return 'Contribution amount is required'
        if (value <= 0) return 'Contribution amount must be greater than 0'
        if (value > 1000000) return 'Contribution amount must not exceed 1,000,000'
        return undefined
      case 'maxMembers':
        if (!value) return 'Max members is required'
        if (value < 2) return 'Group must allow at least 2 members'
        if (value > 50) return 'Group cannot exceed 50 members'
        return undefined
      default:
        return undefined
    }
  }

  const validateStep = (s: number): boolean => {
    const stepFields: Record<number, (keyof FormErrors)[]> = {
      1: ['groupName', 'description'],
      2: ['cycleLength', 'contributionAmount', 'maxMembers'],
    }
    const fields = stepFields[s] ?? []
    const newErrors: FormErrors = { ...errors }
    let valid = true
    fields.forEach((f) => {
      const err = validateField(f, formData[f as keyof GroupFormData])
      if (err) { newErrors[f] = err; valid = false }
      else delete newErrors[f]
    })
    setErrors(newErrors)
    return valid
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setTouched({ ...touched, [name]: true })
    const error = validateField(name, value)
    setErrors({ ...errors, [name]: error })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let processedValue: string | number = value
    if (name === 'cycleLength' || name === 'contributionAmount' || name === 'maxMembers' || name === 'duration') {
      const numValue = parseFloat(value)
      processedValue = isNaN(numValue) ? 0 : numValue
    }
    setFormData({ ...formData, [name]: processedValue })
    if (touched[name]) {
      const error = validateField(name, processedValue)
      setErrors({ ...errors, [name]: error })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof GroupFormData])
      if (error) newErrors[key as keyof FormErrors] = error
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddMember = () => {
    if (memberInput.trim() && !formData.invitedMembers.includes(memberInput.trim())) {
      setFormData({ ...formData, invitedMembers: [...formData.invitedMembers, memberInput.trim()] })
      setMemberInput('')
    }
  }

  const handleRemoveMember = (member: string) => {
    setFormData({ ...formData, invitedMembers: formData.invitedMembers.filter(m => m !== member) })
  }

  const handleNext = () => {
    if (validateStep(step)) setStep((s) => s + 1)
  }

  /**
   * Handles form submission, performing final validation and triggering the contract mutation.
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (!validateForm()) {
      errorSummaryRef.current?.focus()
      return
    }
    try {
      const result = await createGroupMutation.mutateAsync({
        groupName: formData.groupName,
        cycleLength: formData.cycleLength,
        contributionAmount: formData.contributionAmount,
        maxMembers: formData.maxMembers,
      })
      removeDraft()
      toast.success(`Group "${formData.groupName}" created successfully!`)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/groups/${result.groupId}`)
      }
    } catch (err) {
      console.error('Failed to create group:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create group')
    }
  }

  const field = (id: keyof FormErrors, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
        {label}
      </label>
      {input}
      {touched[id] && errors[id] && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{errors[id]}</p>
      )}
    </div>
  )

  const inputCls = (name: keyof FormErrors) =>
    `glass-input w-full px-4 py-3 rounded-lg transition ${touched[name] && errors[name] ? 'border-red-500' : ''}`

  return (
    <div className="glass-form p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-50 mb-1">Create a New Group</h1>
        <p className="text-surface-500 dark:text-surface-400">Set up your savings group and invite members to join</p>
      </div>

      <StepIndicator steps={WIZARD_STEPS} currentStep={step} />

      {hasErrors && submitted && (
        <div ref={errorSummaryRef} role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" tabIndex={-1}>
          <p className="text-sm font-medium text-red-800">
            Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before submitting
          </p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <WizardStep
            title="Basic Information"
            description="Give your group a name and describe its purpose"
            onNext={handleNext}
            canProceed={!!formData.groupName.trim() && formData.groupName.trim().length >= 3}
          >
            {field('groupName', 'Group Name *', (
              <input ref={groupNameRef} id="groupName" name="groupName" type="text"
                value={formData.groupName} onChange={handleChange} onBlur={handleBlur}
                placeholder="e.g., Market Women Ajo" className={inputCls('groupName')}
                aria-required="true" aria-invalid={touched.groupName && !!errors.groupName} />
            ))}
            {field('description', 'Description (optional)', (
              <textarea id="description" name="description" value={formData.description}
                onChange={handleChange} onBlur={handleBlur} rows={3}
                placeholder="Describe your group's purpose..." className={inputCls('description')} />
            ))}
          </WizardStep>
        )}

        {step === 2 && (
          <WizardStep
            title="Group Settings"
            description="Configure contribution rules and schedule"
            onBack={() => setStep(1)}
            onNext={handleNext}
            canProceed={!errors.cycleLength && !errors.contributionAmount && !errors.maxMembers}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {field('cycleLength', 'Cycle Length (days) *', (
                <input id="cycleLength" name="cycleLength" type="number" min="1" max="365"
                  value={formData.cycleLength} onChange={handleChange} onBlur={handleBlur}
                  className={inputCls('cycleLength')} aria-required="true" />
              ))}
              {field('contributionAmount', 'Contribution Amount ($) *', (
                <input id="contributionAmount" name="contributionAmount" type="number" step="0.01" min="0"
                  value={formData.contributionAmount} onChange={handleChange} onBlur={handleBlur}
                  className={inputCls('contributionAmount')} aria-required="true" />
              ))}
            </div>
            {field('maxMembers', 'Max Members *', (
              <input id="maxMembers" name="maxMembers" type="number" min="2" max="50"
                value={formData.maxMembers} onChange={handleChange} onBlur={handleBlur}
                className={inputCls('maxMembers')} aria-required="true" />
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Frequency</label>
                <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange}
                  className="glass-input w-full px-4 py-3 rounded-lg">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Duration (cycles)</label>
                <input id="duration" name="duration" type="number" min="1"
                  value={formData.duration} onChange={handleChange}
                  className="glass-input w-full px-4 py-3 rounded-lg" />
              </div>
            </div>
          </WizardStep>
        )}

        {step === 3 && (
          <WizardStep
            title="Invite Members"
            description="Add wallet addresses to invite (optional)"
            onBack={() => setStep(2)}
            onNext={handleNext}
          >
            <div className="flex gap-2">
              <input type="text" value={memberInput} onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                placeholder="Enter wallet address or email"
                className="glass-input flex-1 px-4 py-3 rounded-lg" />
              <button type="button" onClick={handleAddMember}
                className="px-5 py-3 glass-card-subtle hover:glass-card-interactive text-surface-700 dark:text-surface-300 font-medium rounded-lg transition">
                Add
              </button>
            </div>
            {formData.invitedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.invitedMembers.map((m) => (
                  <span key={m} className="inline-flex items-center gap-2 px-3 py-1.5 glass-card-subtle text-primary-700 dark:text-primary-300 rounded-lg text-sm">
                    {m}
                    <button type="button" onClick={() => handleRemoveMember(m)} aria-label={`Remove ${m}`} className="font-bold hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
            {formData.invitedMembers.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No members added yet. You can skip this step.</p>
            )}
          </WizardStep>
        )}

        {step === 4 && (
          <WizardStep
            title="Review & Create"
            description="Confirm your group details before creating"
            onBack={() => setStep(3)}
            onNext={() => {}}
            nextLabel={loading ? 'Creating...' : 'Create Group'}
            isLastStep
            isLoading={loading}
          >
            <GroupPreview data={formData} />
          </WizardStep>
        )}
      </form>
    </div>
  )
}
