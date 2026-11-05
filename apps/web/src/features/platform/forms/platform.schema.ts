import { z } from 'zod'

export const organizationCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'El código debe tener al menos 3 caracteres.')
    .max(40, 'El código no puede superar 40 caracteres.')
    .regex(
      /^[a-z0-9][a-z0-9-]*$/,
      'Usa minúsculas, números y guiones; sin espacios.',
    ),
  name: z
    .string()
    .trim()
    .min(3, 'Ingresa el nombre del taller.')
    .max(160, 'El nombre no puede superar 160 caracteres.'),
  owner: z.object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Ingresa el nombre del responsable.')
      .max(120, 'El nombre no puede superar 120 caracteres.'),
    email: z
      .string()
      .trim()
      .min(1, 'Ingresa un correo electrónico.')
      .email('Ingresa un correo electrónico válido.')
      .max(254, 'El correo no puede superar 254 caracteres.'),
    username: z
      .string()
      .trim()
      .min(3, 'El usuario debe tener al menos 3 caracteres.')
      .max(50, 'El usuario no puede superar 50 caracteres.')
      .regex(
        /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
        'Usa letras, números, puntos, guiones o guion bajo.',
      ),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .max(128, 'La contraseña no puede superar 128 caracteres.'),
    roleId: z.string().min(1, 'Selecciona un rol para el responsable.'),
  }),
})

export type OrganizationCreateValues = z.infer<typeof organizationCreateSchema>

export const emptyOrganizationCreate: OrganizationCreateValues = {
  code: '',
  name: '',
  owner: {
    displayName: '',
    email: '',
    username: '',
    password: '',
    roleId: '',
  },
}
