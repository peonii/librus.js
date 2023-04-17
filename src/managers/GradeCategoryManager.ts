import { GradeCategory, GradeCategorySchema } from "../structures/GradeCategory";
import { NumberIDResource } from "../structures/NumberIDResource";
import { BaseManager } from "./BaseManager";
import { z } from "zod";

export class GradeCategoryManager extends BaseManager {
  cache: Map<number, GradeCategory> = new Map<number, GradeCategory>();

  /**
   * Fetch a grade category by its ID
   * 
   * @param {number} id ID of the grade category to fetch
   * @returns {Promise<GradeCategory>} Grade category with the given ID
   */
  async fetch(id: number): Promise<GradeCategory> {
    const gradeCategorySchema = z.object({
      Category: GradeCategorySchema
    })

    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const gradeCategory = await this.client.request(gradeCategorySchema, `https://api.librus.pl/3.0/Grades/Categories/${id}`);

    this.cache.set(id, new GradeCategory(gradeCategory.Category, this.client));

    if (gradeCategory.Category.Teacher != null) {
      await this.client.users.fetch(gradeCategory.Category.Teacher.Id);
    }

    await this.client.colors.fetch(gradeCategory.Category.Color.Id);

    return new GradeCategory(gradeCategory.Category, this.client);
  }

  /**
   * **For internal use only.**
   * Fetch a grade category from the cache
   *  
   * @param id ID of the grade category to fetch
   * @returns The grade category with the given ID
   */
  _getFromCache(id: number): GradeCategory {
    return this.cache.get(id)!;
  }

  /**
   * Fetch many grade categories from the given resources
   * 
   * @param {NumberIDResource[]} resources The resources to fetch the grade categories from
   * @returns {Promise<GradeCategory[]>} Grade categories from the given resources
   */
  async fetchManyFromResources(resources: NumberIDResource[]): Promise<GradeCategory[]> {
    const gradeCategories = resources.map(res => res.Id).join(",");

    const gradeCategoriesSchema = z.object({
      Categories: z.array(GradeCategorySchema)
    });

    const gradeCategoriesData = await this.client.request(gradeCategoriesSchema, `https://api.librus.pl/3.0/Grades/Categories/${gradeCategories}`);

    const categoriesWithTeacher = gradeCategoriesData.Categories.filter(gc => gc.Teacher != null);
    await this.client.users.fetchManyFromResources(categoriesWithTeacher.map(gc => gc.Teacher as NumberIDResource));
    await this.client.colors.fetchManyFromResources(gradeCategoriesData.Categories.map(gc => gc.Color));

    return gradeCategoriesData.Categories.map(gradeCategory => {
      this.cache.set(gradeCategory.Id, new GradeCategory(gradeCategory, this.client));
      return new GradeCategory(gradeCategory, this.client);
    });
  }
}