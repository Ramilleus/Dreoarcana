import { CreatureMythras } from '@actor'

export class CharacterMythras extends CreatureMythras {
  static override async create(data: any, context: any): Promise<any> {
    data.token = data.token || {}
    mergeObject(
      data.token,
      {
        vision: true,
        dimSight: 30,
        brightSight: 0,
        actorLink: true,
        disposition: 1
      },
      { overwrite: false }
    )
    return super.create(data, context)
  }
}
