import { EncounterGeneratorActorBuilder } from "../actor-builder"

export class EncounterGeneratorEnemyDetail extends Application {
  private skollProxyBaseUrl: string = "https://www.megproxy.com/"
  private dataReady: boolean = false
  private showLoader: boolean = true
  private enemy: any = {}

  private actorBuilder: EncounterGeneratorActorBuilder

  constructor(private enemyId: string, private enemyName: string, private tags: string, options?: Partial<ApplicationOptions>) {
    super(options)
    this.actorBuilder = new EncounterGeneratorActorBuilder()
  }

  override get title() {
    return this.enemyName
  }

  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "encounter-generator-enemy-detail",
      classes: ['mythras', 'sheet'],
      template: "systems/mythras/templates/apps/encounter-generator/detail/enemy-detail.hbs",
      width: 550,
      height: 600,
      resizable: true
    });
  }

  override async getData(options?: Partial<ApplicationOptions>): Promise<object> {
    const tagList = this.tags.split(',')
    return {
      enemyName: this.enemyName,
      enemy: this.enemy,
      showLoader: this.showLoader,
      dataReady: this.dataReady,
      tags: tagList
    }
  }

  override async _render(force?: boolean, options?: RenderOptions) {
    await super._render(force, options);
    if (!this.dataReady) {
      this.getEnemyData()
    }
  }

  private async getEnemyData() {
    this.enemy = await this.loadEnemy()
    this.showLoader = false
    this.dataReady = true
    this.render(true)
  }

  private async loadEnemy(): Promise<any[]> {
    let response = await fetch(`${this.skollProxyBaseUrl}generate_enemy_json?id=${this.enemyId}`)
    let template = await response.json()
    return template[0]
  }
  
  private async importEnemy() {
    await this.actorBuilder.createActor(this.enemy, null)
  }
  
  override activateListeners(html: JQuery<HTMLElement>): void {
    super.activateListeners(html);

    const refreshButton = html.find(".refresh-button")[0] as HTMLElement | undefined;
    if (refreshButton) {
      refreshButton.addEventListener("click", (event) => {
        event.preventDefault()
        this.showLoader = true
        this.dataReady = false
        this.render(true); // TS-safe, v13 uses boolean for force
      });
    }

    const importButton = html.find(".import-button")[0] as HTMLElement | undefined;
    if (importButton) {
      importButton.addEventListener("click", (event) => {
        event.preventDefault()
        this.importEnemy()
      });
    }
  }
}
