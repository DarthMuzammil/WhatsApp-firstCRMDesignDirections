// Shared settings for the end-to-end checks. run.mjs sets BASE_URL; screenshots go to a git-ignored folder.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5199'
export const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'screenshots')
fs.mkdirSync(SHOTS, { recursive: true })
