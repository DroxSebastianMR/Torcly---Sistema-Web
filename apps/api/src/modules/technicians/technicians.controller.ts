import type { RequestHandler } from 'express'
import { getRequestContext } from '../auth/auth.middleware.js'
import {
  technicianIdSchema,
  technicianInputSchema,
  technicianQuerySchema,
  technicianStatusSchema,
} from './technicians.schemas.js'
import { techniciansService } from './technicians.service.js'
export const listTechnicians: RequestHandler = async (req, res) => {
  res.json(
    await techniciansService.list(technicianQuerySchema.parse(req.query)),
  )
}
export const getTechnician: RequestHandler = async (req, res) => {
  res.json(
    await techniciansService.getById(technicianIdSchema.parse(req.params).id),
  )
}
export const getTechnicianOptions: RequestHandler = async (_req, res) => {
  res.json(await techniciansService.getOptions())
}
export const createTechnician: RequestHandler = async (req, res) => {
  res
    .status(201)
    .json(
      await techniciansService.create(
        technicianInputSchema.parse(req.body),
        req.auth!.id,
        getRequestContext(req, res),
      ),
    )
}
export const updateTechnician: RequestHandler = async (req, res) => {
  res.json(
    await techniciansService.update(
      technicianIdSchema.parse(req.params).id,
      technicianInputSchema.parse(req.body),
      req.auth!.id,
      getRequestContext(req, res),
    ),
  )
}
export const updateTechnicianStatus: RequestHandler = async (req, res) => {
  res.json(
    await techniciansService.updateStatus(
      technicianIdSchema.parse(req.params).id,
      technicianStatusSchema.parse(req.body).active,
      req.auth!.id,
      getRequestContext(req, res),
    ),
  )
}
