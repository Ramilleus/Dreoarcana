import { EncounterGeneratorImporter } from './base'

export class EncounterGeneratorEnemyImporter extends EncounterGeneratorImporter {
  protected rowListElementSelector: string = 'div.enemy-template-list-rows'
  protected templatesUrl: string = 'get_enemy_template_list'
  protected tabName: string = 'enemies'

  public rankMap = {
    1: "Rabble 1",
    2: "Novice 2",
    3: "Skilled 3",
    4: "Veteran 4",
    5: "Master 5"
  }

  public reverseRankMap = {
    "Rabble 1": 1,
    "Novice 2": 2,
    "Skilled 3": 3,
    "Veteran 4": 4,
    "Master 5": 5
  }

  public raceList: Record<string, boolean> = {}
  public racesReady: boolean = false

  private selectedRaces: Record<string, boolean> = {}
  private selectedRanks: Record<string, boolean> = {}

  protected filters: {
    search: string,
    ranks: Record<string, boolean>
  }

  protected prepareFilters(): void {
    this.filters = {
      search: "",
      ranks: {
        "Rabble 1": false,
        "Novice 2": false,
        "Skilled 3": false,
        "Veteran 4": false,
        "Master 5": false
      }
    }
  }

  protected filterTemplates(template: any) {
    let include = true
    const searchText = this.filters.search
    const nameAndRace = template.name.toLocaleLowerCase() + template.race.toLocaleLowerCase()
    if (Object.keys(this.selectedTags).length) {
      include = false
      for (let tag of template.tags) {
        if (Object.keys(this.selectedTags).includes(tag)) {
          include = true
        }
      }
    }
    if (!nameAndRace.includes(searchText.toLocaleLowerCase())) {
      include = false
    }
    if (Object.keys(this.selectedRaces).length && !Object.keys(this.selectedRaces).includes(template.race)) {
      include = false
    }
    if (Object.keys(this.selectedOwners).length && !Object.keys(this.selectedOwners).includes(template.owner)) {
      include = false
    }
    if (Object.keys(this.selectedRanks).length && !Object.keys(this.selectedRanks).includes(String(template.rank))) {
      include = false
    }
    return include
  }

  private searchEnemies($searchInput: JQuery<HTMLElement>) {
    if (this.showAdvancedFilters) {
      this.element.find('[data-filter-list]').each((_, element) => {
        const listName = $(element).data().filterList
        this.filterListLastScrollTops[listName] = element.scrollTop
      })
    }

    this.filters.search = $searchInput.val() as string
    this.scrollLimit = 100
    this.lastScrollTop = 0
    this.templatesPage = []
    this.dataReady = false
    this.showLoader = true
    this.encounterGenerator.render(true)
  }

  
  private async getRaces() {
    if (!this.allTemplates) {
      this.allTemplates = await this.loadTemplates()
    }
    let races: any = {}
    for (let template of this.allTemplates) {
      races[template.race] = false
    }
    this.raceList = this.orderObjectByKey(races)
    this.racesReady = true
  }

  public override render(): void {
    super.render()
    if (!this.racesReady) {
      this.getRaces()
    }
  }


  public override activateListeners(): void {
    super.activateListeners()
    const $enemyFilters = this.element.find(".template-list-filters");
    const $enemySearchInput = $enemyFilters.find('input[name=searchTerm]')
    $enemySearchInput.on('keypress', (event) => {
      if(event.key === 'Enter')
      {
        this.searchEnemies($enemySearchInput)
      }
    });
    $enemyFilters.find('.search-button').on('click', (event) => {
      this.searchEnemies($enemySearchInput)
    })
    $enemyFilters.find('.race').on('change', (event) => {
      const checkbox = event.currentTarget as HTMLInputElement
      const raceName = $(checkbox).data().raceName

      this.raceList[raceName] = checkbox.checked
      if (checkbox.checked) {
        this.selectedRaces[raceName] = true
      } else {
        delete this.selectedRaces[raceName]
      }
    })
    $enemyFilters.find('.rank').on('change', (event) => {
      const checkbox = event.currentTarget as HTMLInputElement
      const rank = $(checkbox).data().rank
      const rankName = $(checkbox).data().rankName

      this.filters.ranks[rankName] = checkbox.checked
      if (checkbox.checked) {
        this.selectedRanks[rank] = true
      } else {
        delete this.selectedRanks[rank]
      }
    })
  }

  public async importEnemy(id: string) {
    let response = await fetch(`${this.skollProxyBaseUrl}generate_enemy_json?id=${id}`)
    let template = await response.json()
    this.importEnemyFromJson(template)
  }

  public async importEnemyFromJson(jsonObject: any) {
    let skollEnemy = jsonObject
    if (Array.isArray(jsonObject)) {
      skollEnemy = jsonObject[0]
    }
    await this.actorBuilder.createActor(skollEnemy, null)
  }
}
