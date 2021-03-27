import Search from './models/Search'
import Recipe from './models/Recipe'
import List from './models/List'
import * as searchView from './views/searchView'
import * as recipeView from './views/recipeView'
import * as listView from './views/listView'
import * as likesView from './views/likesView'
import { elements, renderLoader, clearLoader } from './views/base'
import Likes from './models/Likes'

/* Global state of the app */
const state = {}
/* ==========================================  
Search controller 
============================================= */

const controlSearch = async () => {
    // 1. get query from view
    const query = searchView.getInput()


    if(query) {
        // 2 new search object and add to search
        state.search = new Search(query)

        // 3 prepareUI for results
        searchView.clearInput()
        searchView.clearResults()
        renderLoader(elements.searchResults)

        try {
             // 4. search for results
            await state.search.getResults()

            // render results on UI
            clearLoader()
            searchView.renderResults(state.search.result)
        } catch (err) {
            alert('Something went wrong')
            clearLoader()
        }
       
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault()
    controlSearch()
})

elements.searchResultPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline')
    if(btn) {
        const goToPage = parseInt(btn.dataset.goto, 10)
        searchView.clearResults()
        searchView.renderResults(state.search.result, goToPage)
    }
})

/* ==========================================  
Recipe controller 
============================================= */
const controlRecipe = async () => {
    // get id from url
    const id = window.location.hash.replace('#', '')
    
    if(id) {
        // prepare UI for changes
        recipeView.clearRecipe()
        renderLoader(elements.recipe)

        //Highlight selected search item
        if(state.search) searchView.highlightSelected(id)

        // create a new recipe object
        state.recipe = new Recipe(id)

        try{
        //get recipe data
            await state.recipe.getRecipe()
           
            state.recipe.parseIngredients()
            // calculate servings and time
            state.recipe.calcTime()
            state.recipe.calcServings()
            // render recipe
           clearLoader()
           
           recipeView.renderRecipe(
               state.recipe,
               state.likes.isLiked(id)
               )

        } catch (error ){
            alert('Error processing recipe!')
        }
    }

}

// window.addEventListener('hashchange', controlRecipe)
// window.addEventListener('load', controlRecipe)

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe)) 

/* 
LIST CONTROLLER
*/
const controlList = () => {
    // create a new list if there is none yet
    if(!state.list) state.list = new List()

    // add ingredients to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient)
        listView.renderItem(item)
    })
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid

    //handle delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        // delete from state
        state.list.deleteItem(id)

        // delete from UI
        listView.deleteItem(id)

        //handle update
    } else if(e.target.matches('.shopping__count-value')) {
        const val = parseInt(e.target.value)
        state.list.updateCount(id, val)
    }
})

/** 
 * LIKE CONTROLLER
 */
const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // User has NOT yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        // Add like to the state
        const newLike = state.likes.addLike(
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        // Toggle the like button
        likesView.toggleLikeBtn(true);

        // Add like to UI list
        likesView.renderLike(newLike);

    // User HAS liked current recipe
    } else {
        // Remove like from the state
        state.likes.deleteLike(currentID);

        // Toggle the like button
        likesView.toggleLikeBtn(false);

        // Remove like from UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', () => {
    state.likes = new Likes();
    
    // Restore likes
    state.likes.readStorage();

    // Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // Render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});
// handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec')
            recipeView.updateServingsIngredients(state.recipe)
        }
        
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        state.recipe.updateServings('inc')
        recipeView.updateServingsIngredients(state.recipe)
    } else if (e.target.matches('.recipe__btn-add, .recipe__btn--add *')) {
        //Add to shopping list
        controlList()
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller
        controlLike()
    }

})
