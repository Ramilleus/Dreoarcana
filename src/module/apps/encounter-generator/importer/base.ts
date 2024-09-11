import { EncounterGenerator } from '@apps/encounter-generator'
import { EncounterGeneratorActorBuilder } from '@apps/encounter-generator/actor-builder'

export abstract class EncounterGeneratorImporter {
  constructor(protected encounterGenerator: EncounterGenerator) {
    this.prepareFilters()
    this.actorBuilder = new EncounterGeneratorActorBuilder()
  }

  get $templateList() {
    return this.element.find(this.rowListElementSelector)
  }

  get element() {
    return this.encounterGenerator.element.find(`.${this.tabName}`)
  }

  protected actorBuilder: EncounterGeneratorActorBuilder

  public showAdvancedFilters: boolean = false
  public showLoader: boolean = true
  public dataReady: boolean = false
  public templatesPage: any[] = []
  public tagList: any = {}
  public ownerList: any = {}
  public selectedTags: any = {}
  public selectedOwners: any = {}

  protected abstract templatesUrl: string
  protected abstract rowListElementSelector: string
  protected abstract tabName: string
  protected abstract filters: any
  protected abstract prepareFilters(): void
  protected abstract filterTemplates(template: any): void

  protected skollProxyBaseUrl: string = 'https://www.megproxy.com/'
  protected scrollLimitHit: boolean = false
  protected scrollLimit: number = 100
  protected totalTemplateCount: number = 0
  protected totalFilteredCount: number = 0
  protected lastScrollTop: number = 0

  protected allTemplates: any[]
  private tagsReady: boolean = false
  private ownersReady: boolean = false
  protected filterListLastScrollTops: any = {}

  public render() {
    this.$templateList.scrollTop(this.lastScrollTop)
    if (!this.dataReady) {
      this.getTemplatesPage()
    }
    if (!this.tagsReady) {
      this.getTags()
    }
    if (!this.ownersReady) {
      this.getOwners()
    }
    this.toggleFilterSection()
    this.scrollFilterLists()
  }

  public activateListeners() {
    this.$templateList.on('scroll', async (event) => {
      if (this.scrollLimit >= this.totalFilteredCount) {
        return
      }
      const target = event.currentTarget
      if (target.scrollTop + target.clientHeight === target.scrollHeight) {
        const currentValue = this.scrollLimit
        const maxValue = this.totalTemplateCount ?? 0
        if (currentValue < maxValue && !this.scrollLimitHit) {
          this.scrollLimitHit = true
          const newValue = Math.clamp(currentValue + 100, 100, maxValue)
          this.scrollLimit = newValue
          this.lastScrollTop = target.scrollTop
          this.dataReady = false
          this.showLoader = true
          this.encounterGenerator.render(true)
        }
      }
    })

    this.element.find('.advanced-filters-button').on('click', (event) => {
      this.showAdvancedFilters = !this.showAdvancedFilters
      this.toggleFilterSection()
    })
    this.element.find('.tag').on('change', (event) => {
      const checkbox = event.currentTarget as HTMLInputElement
      const tagName = $(checkbox).data().tagName

      this.tagList[tagName] = checkbox.checked
      if (checkbox.checked) {
        this.selectedTags[tagName] = true
      } else {
        delete this.selectedTags[tagName]
      }
    })
    this.element.find('.owner').on('change', (event) => {
      const checkbox = event.currentTarget as HTMLInputElement
      const ownerName = $(checkbox).data().ownerName

      this.ownerList[ownerName] = checkbox.checked
      if (checkbox.checked) {
        this.selectedOwners[ownerName] = true
      } else {
        delete this.selectedOwners[ownerName]
      }
    })
  }

  private scrollFilterLists() {
    Object.keys(this.filterListLastScrollTops).forEach((listName) => {
      this.element
        .find(`[data-filter-list=${listName}]`)
        .scrollTop(this.filterListLastScrollTops[listName])
    })
  }

  private toggleFilterSection() {
    if (this.showAdvancedFilters) {
      this.element.find('.advanced-filters-section').show()
      this.scrollFilterLists()
    } else {
      this.element.find('.advanced-filters-section').hide()
    }
  }

  protected async getTemplatesPage() {
    if (!this.allTemplates) {
      this.allTemplates = await this.loadTemplates()
    }
    let filtered = this.allTemplates.filter(this.filterTemplates.bind(this))
    this.totalFilteredCount = filtered.length
    this.templatesPage = filtered.slice(0, this.scrollLimit)
    this.dataReady = true
    this.scrollLimitHit = false
    this.showLoader = false
    this.encounterGenerator.render(true)
  }

  protected async getTags() {
    if (!this.allTemplates) {
      this.allTemplates = await this.loadTemplates()
    }
    let tags: any = {}
    for (let template of this.allTemplates) {
      for (let tag of template.tags) {
        tags[tag] = false
      }
    }
    delete tags['']
    this.tagList = this.orderObjectByKey(tags)
    this.tagsReady = true
  }

  protected async getOwners() {
    if (!this.allTemplates) {
      this.allTemplates = await this.loadTemplates()
    }
    let owners: any = {}
    for (let template of this.allTemplates) {
      owners[template.owner] = false
    }
    this.ownerList = this.orderObjectByKey(owners)
    this.ownersReady = true
  }

  protected orderObjectByKey(unordered: any) {
    const ordered = Object.keys(unordered)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .reduce((obj: any, key) => {
        obj[key] = unordered[key]
        return obj
      }, {})

    return ordered
  }

  protected async loadTemplates(): Promise<any[]> {
    let response = await fetch(`${this.skollProxyBaseUrl}${this.templatesUrl}`)
    let templates = await response.json()
    this.totalTemplateCount = templates.length
    return templates
  }
}
