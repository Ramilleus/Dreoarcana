export class SheetPostRender {
  //@ts-ignore
  constructor(private sheetElement: JQuery<HTMLElement>) {}

  public postRender() {
    this.applyStatStyles()
    //this.resizeFitWidthInputs()
  }

  private applyStatStyles() {
    this.sheetElement.find('.modifier').each((_: any, modifier: HTMLInputElement) => {
      let statToModify = $(modifier).closest('[data-stat]').find('.modifiable')
      if (Number(modifier.value) > 0) {
        $(modifier).removeClass('decreased').addClass('increased')
        statToModify.removeClass('decreased').addClass('increased')
      } else if (Number(modifier.value) < 0) {
        $(modifier).removeClass('increased').addClass('decreased')
        statToModify.removeClass('increased').addClass('decreased')
      } else {
        $(modifier).removeClass('decreased increased')
        statToModify.removeClass('decreased increased')
      }
    })
  }

  // private resizeFitWidthInputs() {
  //   const input = this.sheetElement.find('.text-input--fit-width')
  //   input.width((input.val() as string).length + 'ch')
  // }
}
