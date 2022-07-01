export class EncounterGenerator extends Application {
  scrollLimit: number = 100
  totalTemplateCount: number = 0
  lastScrollTop: number = 0
  constructor(options = {}) {
    super(options);

    this.injectActorDirectory();
    this.loadTemplates()
  }

  override get title() {
    return "Mythras Encounter Generator";
  }

  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "encounter-generator",
      classes: [],
      template: "systems/mythras/templates/apps/encounter-generator/encounter-generator.html",
      width: 800,
      height: 700,
      resizable: true,
    });
  }

  override async _render(force?: boolean, options?: RenderOptions) {
    await super._render(force, options);
    const $list = this.element.find("div.template-list");
    $list.scrollTop(this.lastScrollTop)
    this.activateGeneratorListeners();
  }

  override async getData(options?: Partial<ApplicationOptions>): Promise<object> {
    return {
      templates: await this.getTemplatesPage()
    }
  }

  async getTemplatesPage() {
    return (await this.loadTemplates()).slice(0, this.scrollLimit)
  }

  async loadTemplates(): Promise<any[]> {
    let response = await fetch('http://3.13.17.94/get_template_list')
    let templates = await response.json()
    this.totalTemplateCount = templates.length
    return templates
  }

  

  private activateGeneratorListeners() {
    const $list = this.element.find("div.template-list");
    //if ($list.length === 0) return;
  
    $list.on("scroll", (event) => {
        const target = event.currentTarget;
        if (target.scrollTop + target.clientHeight === target.scrollHeight) {
            const currentValue = this.scrollLimit;
            const maxValue = this.totalTemplateCount ?? 0;
            if (currentValue < maxValue) {
                const newValue = Math.clamped(currentValue + 100, 100, maxValue);
                this.scrollLimit = newValue;
                this.lastScrollTop = target.scrollTop
                this.render(true);
            }
        }
    });
  }

  injectActorDirectory() {
    const $html = ui.actors.element
    if ($html.find('.encounter-generator-btn').length > 0) return

    // Bestiary Browser Buttons
    const encounterGeneratorButton = $(
      `<div class="encounter-generator-btn-container"><button class="encounter-generator-btn">Mythras Encounter Generator</button></div>`
    )

    if (game.user.isGM) {
      $html.find('footer').append(encounterGeneratorButton)
    }
    
      // Handle button clicks
    encounterGeneratorButton.on("click", (ev) => {
      ev.preventDefault();
      this._render(true)
    });
  }
}