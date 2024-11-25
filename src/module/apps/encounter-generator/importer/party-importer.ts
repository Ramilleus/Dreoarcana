import { EncounterGeneratorImporter } from './base'

export class EncounterGeneratorPartyImporter extends EncounterGeneratorImporter {
  protected rowListElementSelector: string = 'div.party-template-list-rows'
  protected templatesUrl: string = 'get_party_template_list'
  protected tabName: string = 'parties'

  protected filters: {
    search: string
  }

  protected prepareFilters(): void {
    this.filters = {
      search: ""
    }
  }

  protected filterTemplates(template: any) {
    let include = true
    const searchText = this.filters.search
    if (Object.keys(this.selectedTags).length) {
      include = false
      for (let tag of template.tags) {
        if (Object.keys(this.selectedTags).includes(tag)) {
          include = true
        }
      }
    }
    if (!template.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) {
      include = false
    }
    if (Object.keys(this.selectedOwners).length && !Object.keys(this.selectedOwners).includes(template.owner)) {
      include = false
    }

    return include
  }

  //@ts-ignore
  private searchParties($searchInput: JQuery<HTMLElement>) {
    if (this.showAdvancedFilters) {
      this.element.find('[data-filter-list]').each((_: any, element: { scrollTop: any }) => {
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

  public override activateListeners(): void {
    super.activateListeners()
    const $partyFilters = this.element.find(".template-list-filters");
    const $partySearchInput = $partyFilters.find('input[name=searchTerm]')
    $partySearchInput.on('keypress', (event: { key: string }) => {
      if(event.key === 'Enter')
      {
        this.searchParties($partySearchInput)
      }
    });
    $partyFilters.find('.search-button').on('click', (event: any) => {
      this.searchParties($partySearchInput)
    })
  }

  public async importParty(id: string) {
    let response = await fetch(`${this.skollProxyBaseUrl}generate_party_json?id=${id}`)
    let template = await response.json()
    this.importPartyFromJson(template)
  }

  public async importPartyFromJson(jsonObject: any) {
    let folder = await Folder.create({
      name: `${jsonObject['party_name']}`,
      type: 'Actor'
    })
    jsonObject.enemies.forEach(async (enemy: any) => {
      await this.actorBuilder.createActor(enemy, folder.id)
    })
  }
}
