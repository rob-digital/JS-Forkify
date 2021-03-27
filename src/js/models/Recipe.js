import axios from 'axios'
import { config } from '../config'

export default class Recipe {
    constructor(id) {
        this.id = id
    }

    async getRecipe() {
        try {
            const res = await axios(`${config.proxy}https://forkify-api.herokuapp.com/api/get?rId=${this.id}`)
            this.title = res.data.recipe.title
            this.author = res.data.recipe.publisher
            this.img = res.data.recipe.image_url
            this.url = res.data.recipe.source_url
            this.ingredients = res.data.recipe.ingredients
        } catch (error) {
            alert(error)
        }
    }

    calcTime() {
        // Assuming that we need 15 min for each 3 ingredients
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }
    calcServings() {
        this.servings = 4
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds']
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound']
        const units = [...unitsShort, 'kg', 'g']

        const newIngredients = this.ingredients.map(el => {
            // uniform units
            let ingredient = el.toLowerCase()
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, units[i])
            })
            // remove parentheses
            ingredient = ingredient.replace(/ *\([^)]*\) */g, '');
            // parse ingredients into count, unit and ingredients
            const arrIngr = ingredient.split(' ')
            const unitIndex = arrIngr.findIndex(elem => units.includes(elem))

            let objIngredient
            if(unitIndex > -1) {
                // there is a unit
                const arrCount = arrIngr.slice(0, unitIndex)
                let count
                if (arrCount.length === 1) {
                    count = eval(arrIngr[0].replace('-', '+'))
                } else {
                    count = eval(arrIngr.slice(0, unitIndex).join('+'))
                }
                objIngredient = {
                    count,
                    unit: arrIngr[unitIndex],
                    ingredient: arrIngr.slice(unitIndex + 1).join(' ')
                }


            } else if(parseInt(arrIngr[0], 10)) {
                // no unit but first elem is a number
                objIngredient = {
                    count: parseInt(arrIngr[0], 10),
                    unit: '',
                    ingredient: arrIngr.slice(1).join(' ')
                }
            }
            else if(unitIndex === -1) {
                // there is no unit and no number
                objIngredient = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }

            return objIngredient
        })
        this.ingredients = newIngredients
    }

    updateServings(type) {
        //Servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1

        //Ingredients
        this.ingredients.forEach(el => {
            el.count *= (newServings / this.servings)
        })

        this.servings = newServings
    }
}