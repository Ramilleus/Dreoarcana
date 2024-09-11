import { CreatureMythras } from '@actor'

export class CharacterMythras<TParent extends TokenDocument | null = TokenDocument | null> extends CreatureMythras<TParent> {
  async _preCreate(data: any, options: any, user: any){
    await super._preCreate(data,options,user)

    let initData = {
      "prototypeToken.actorLink": true
    }
    this.updateSource(initData)
  }
  //TODO: Figure out how to (by default) enable actorLink for characters
  // static override async create(data: any, context: any): Promise<any> {
  //   console.log(data)
  //   console.log('bigtest')
  //   data.prototypeToken.actorLink = true
  //   console.log(data)
  //   // foundry.utils.mergeObject(
  //   //   data.token,
  //   //   {
  //   //     vision: true,
  //   //     dimSight: 30,
  //   //     brightSight: 0,
  //   //     actorLink: true,
  //   //     disposition: 1
  //   //   },
  //   //   { overwrite: false }
  //   // )
  //   return super.create(data, context)
  // }
}
