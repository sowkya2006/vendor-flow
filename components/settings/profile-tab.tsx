'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { profileSchema, type ProfileFormValues } from '@/lib/validations/settings'
import { updateProfileAction } from '@/app/actions/settings'

// ── small helpers ─────────────────────────────────────────────────────────────

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-[--color-foreground]"
    >
      {children}
      {required && <span className="ml-0.5 text-[--color-destructive]">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-[--color-destructive]">{message}</p>
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Manager',
  viewer: 'Viewer',
  approver: 'Approver',
}

// ── props ─────────────────────────────────────────────────────────────────────

interface ProfileTabProps {
  profile: {
    full_name: string
    email: string
    role: string
    created_at: string
  }
}

// ── component ─────────────────────────────────────────────────────────────────

export function ProfileTab({ profile }: ProfileTabProps) {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile.full_name,
      email: profile.email,
    },
  })

  function onSubmit(values: ProfileFormValues) {
    startTransition(async () => {
      const result = await updateProfileAction(values)
      if (result.success) {
        toast.success(result.message ?? 'Profile updated')
      } else {
        toast.error(result.error)
      }
    })
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Avatar + meta */}
      <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
        <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">Profile picture</h2>
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials(profile.full_name) || <User className="h-6 w-6" />}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-[--color-foreground]">{profile.full_name || '—'}</p>
            <p className="text-xs text-[--color-foreground-muted] mt-0.5">
              {ROLE_LABELS[profile.role] ?? profile.role} · Member since {memberSince}
            </p>
            <p className="mt-2 text-xs text-[--color-foreground-subtle]">
              Avatar is generated from your initials. Custom photo upload coming soon.
            </p>
          </div>
        </div>
      </section>

      {/* Editable fields */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <section className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
          <h2 className="mb-4 text-sm font-semibold text-[--color-foreground]">Personal information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Full name */}
            <div className="flex flex-col sm:col-span-2">
              <Label htmlFor="full_name" required>Full name</Label>
              <Input
                id="full_name"
                placeholder="Jane Smith"
                aria-invalid={!!errors.full_name}
                {...register('full_name')}
              />
              <FieldError message={errors.full_name?.message} />
            </div>

            {/* Email */}
            <div className="flex flex-col sm:col-span-2">
              <Label htmlFor="email" required>Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@company.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
              <p className="mt-1 text-xs text-[--color-foreground-subtle]">
                Changing your email will send a confirmation to the new address.
              </p>
            </div>

            {/* Role — read-only */}
            <div className="flex flex-col">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={ROLE_LABELS[profile.role] ?? profile.role}
                disabled
                aria-readonly="true"
              />
              <p className="mt-1 text-xs text-[--color-foreground-subtle]">
                Contact your admin to change your role.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </section>
      </form>
    </div>
  )
}
