export {}

declare global {
    // @ts-ignore
    type PlaceableObject = typeof globalThis extends { PlaceableObject: any } ? globalThis.PlaceableObject : any
    // @ts-ignore
    type PreciseText = typeof globalThis extends { PreciseText: any } ? globalThis.PreciseText : any

    /**
     * @deprecated ObjectHUD was removed in Foundry VTT v13. This is a legacy type.
     */
    class ObjectHUD<T extends PlaceableObject> extends PIXI.Container {
        constructor(object: T)

        readonly visible: boolean
        readonly renderable: boolean

        createScrollingText(
            content: string,
            { anchor, direction, duration, jitter, ...textStyle }?: ScrollingTextOptions,
        ): Promise<PreciseText | null>

        protected _animateScrollText(
            text: PreciseText,
            duration: number,
            dx?: number,
            dy?: number
        ): Promise<void>
    }
}

interface ScrollingTextOptions extends Partial<PIXI.ITextStyle> {
    anchor?: number
    direction?: number
    duration?: number
    jitter?: number
}
