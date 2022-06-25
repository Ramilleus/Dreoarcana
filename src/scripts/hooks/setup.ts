import { registerSheets } from '@scripts/register-sheets'

export const Setup = {
  listen: (): void => {
    registerSheets()
  }
}
