import { EncounterGeneratorEnemyDetail } from "./detail/enemy-detail"
import { EncounterGeneratorEnemyImporter } from "./importer/enemy-importer"
import { EncounterGeneratorPartyImporter } from "./importer/party-importer"

export class EncounterGenerator extends Application {
  private enemyImporter: EncounterGeneratorEnemyImporter
  private partyImporter: EncounterGeneratorPartyImporter
  constructor(options = {}) {
    super(options);

    this.enemyImporter = new EncounterGeneratorEnemyImporter(this)
    this.partyImporter = new EncounterGeneratorPartyImporter(this)
    this.injectActorDirectory()
  }
  

  override get title() {
    return "Mythras Encounter Generator";
  }

  static override get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "encounter-generator",
      classes: ['mythras', 'sheet'],
      template: "systems/mythras/templates/apps/encounter-generator/encounter-generator.hbs",
      width: 800,
      height: 700,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'enemies'
        }
      ]
    });
  }

  override async _render(force?: boolean, options?: RenderOptions) {
    await super._render(force, options);
    this.enemyImporter.render()
    this.partyImporter.render()
  }

  override async getData(options?: Partial<ApplicationOptions>): Promise<object> {
    return {
      tabs: [
        {
          name: 'enemies',
          label: 'Generate Enemies'
        },
        {
          name: 'parties',
          label: 'Generate Parties'
        },
        {
          name: 'from-json',
          label: 'Generate from JSON'
        },
        {
          name: 'credits',
          label: 'Credits'
        }
      ],
      enemies: this.enemyImporter,
      parties: this.partyImporter
    }
  }

  override activateListeners($html: JQuery<HTMLElement>): void {
    super.activateListeners($html)
    this.enemyImporter.activateListeners()
    this.partyImporter.activateListeners()
    
    const  $importButtons = this.element.find('.import-button')
    $importButtons.on('click', (event) => {
      event.stopPropagation()
      let target = event.target
      let elem = $(target.closest('[data-template-id]'))
      let id = elem.attr('data-template-id')
      let type = elem.attr('data-template-type')
      if (type === "enemy") {
        this.enemyImporter.importEnemy(id)
      } else if (type === "party") {
        this.partyImporter.importParty(id)
      }
    })

    const $templateRows = this.element.find('[data-template-id]')
    $templateRows.on('click', (event) => {
      event.preventDefault()
      let id = $(event.currentTarget).data().templateId
      let type = $(event.currentTarget).data().templateType
      let name = $(event.currentTarget).data().templateName
      let tags = $(event.currentTarget).data().templateTags
      if (type === "enemy") {
        const detail = new EncounterGeneratorEnemyDetail(id, name, tags)
        detail.render(true)
      } else if (type === "party") {
      }
    })

    const $createEnemyJson = this.element.find('#create-enemy-json')
    const $createEnemyJsonButton = this.element.find('#create-enemy-button')
    $createEnemyJsonButton.on('click', (event) => {
      event.preventDefault()
      let json = $createEnemyJson.val() as string
      this.enemyImporter.importEnemyFromJson(JSON.parse(json))
    })

    const $createPartyJson = this.element.find('#create-party-json')
    const $createPartyJsonButton = this.element.find('#create-party-button')
    $createPartyJsonButton.on('click', (event) => {
      event.preventDefault()
      let json = $createPartyJson.val() as string
      this.partyImporter.importPartyFromJson(JSON.parse(json))
    })
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