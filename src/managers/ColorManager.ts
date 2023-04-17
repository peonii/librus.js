import { Color, ColorSchema, ColorTransformer } from "../structures/Color";
import { NumberIDResource } from "../structures/NumberIDResource";
import { BaseManager } from "./BaseManager";
import { z } from "zod";

export class ColorManager extends BaseManager {
  cache: Map<number, Color> = new Map<number, Color>();

  async fetch(id: number): Promise<Color> {
    const colorSchema = z.object({
      Color: ColorSchema
    })

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const color = await this.client.request(colorSchema, `https://api.librus.pl/3.0/Colors/${id}`);

    const transformedColor = ColorTransformer.parse(color.Color);

    this.cache.set(id, transformedColor);

    return transformedColor;
  }

  _getFromCache(id: number): Color {
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    throw new Error("Color not found in cache");
  }

  async fetchManyFromResources(resources: NumberIDResource[]): Promise<Color[]> {
    const colors = resources.map(res => res.Id).join(",");

    const colorSchema = z.object({
      Colors: z.array(ColorSchema)
    });

    const colorsData = await this.client.request(colorSchema, `https://api.librus.pl/3.0/Colors/${colors}`);

    return colorsData.Colors.map(color => {
      this.cache.set(color.Id, ColorTransformer.parse(color));
      return ColorTransformer.parse(color);
    });
  }
}