function runSearchPageSearch(page) {
    const urlParams = new URLSearchParams(window.location.search)
    const query = urlParams.get('q')

    const searchResultsContainer = document.getElementById('search-results')

    // Erase previous results
    searchResultsContainer.innerHTML = ""
    document.querySelector('.pagination-item').innerHTML = ""
    addHeadingForQuery(query, searchResultsContainer)

    const docSearch = docSearchReady()
    const index = docSearch.client.initIndex('wagtail')
    index.search(
        query,
        {
            hitsPerPage: 100,
            page: page,
            facetFilters: [getVersionFacetFilter()]
        }
    )
        .then(result => {
        // Display pagination if more than 1 page returned
        let nbPages = result["nbPages"]
        if (nbPages > 1) {
            document.querySelector("#pagination").hidden = false;
            displayPagination(page, nbPages)
        }

        // Display hits
        let hits = result["hits"]
        addResultsList(hits, query, searchResultsContainer)
    })
        .catch((error) => console.log(error))
}

function displayPagination(page, totalPages) {
    const pagination = document.querySelector("#pagination")
    const paginationItem = pagination.querySelector(".pagination-item")
    const paginationPrevious = pagination.querySelector(".pagination-previous")
    const paginationNext = pagination.querySelector(".pagination-next")
    
    
    // Hide previous/next button if showing first/last page
    pagination.querySelector(".pagination-previous").hidden = false;
    pagination.querySelector(".pagination-previous").hidden = page === 0;
    pagination.querySelector(".pagination-next").hidden = page === totalPages -1;

    // Display at most "toBeDisplayed" page links in the paginator
    const toBeDisplayed = 7
    let [start, end] = setStartEndForPaginator(page, totalPages, toBeDisplayed)

    for (let i = start; i < end; i++) {
        let newPaginationbutton = document.createElement("button");
        let previousPaginationbutton = document.createElement("button");
        let nextPaginationbutton = document.createElement("button");
        newPaginationbutton.classList.add("pagination-button");
        previousPaginationbutton.classList.add("pagination-button");
        nextPaginationbutton.classList.add("pagination-button");

        let flag =false;
        if (i == page) {
            newPaginationbutton.innerHTML = "Page " + (i+1) + " of " + end;
            previousPaginationbutton.innerHTML = "← Previous";
            nextPaginationbutton.innerHTML = "Next →";
            newPaginationbutton.setAttribute("aria-label", `page ${i+1}`)
            newPaginationbutton.setAttribute("aria-current", `${i}`)
            flag = true;
        }
    
        // Register event handlers - Replaced onclick with AddEventListeners
        newPaginationbutton.addEventListener("click", () => { runSearchPageSearch(page) });
        previousPaginationbutton.addEventListener("click", () => { runSearchPageSearch(page - 1) });
        nextPaginationbutton.addEventListener("click", () => { runSearchPageSearch(page + 1) });

        let currentButton = document.querySelector("#pagination > div.pagination-item > button");
        let nextButton = document.querySelector("#pagination-next > button");
        let prevButton = document.querySelector("#pagination-previous > button");
        if(currentButton && flag == true){
            paginationItem.replaceChild(newPaginationbutton, currentButton);
        }
        else{
            if(flag==true){
                paginationItem.append(newPaginationbutton);
            }
        }
        if(nextButton && flag == true){
            paginationNext.replaceChild(nextPaginationbutton, nextButton);
        }
        else{
            if(flag==true){
                paginationNext.append(nextPaginationbutton);
            }
        }
        if(prevButton && flag == true){
            paginationPrevious.replaceChild(previousPaginationbutton, prevButton);
        }
        else{
            if(flag==true){
                paginationPrevious.append(previousPaginationbutton)
            }
        }

    }
    
}

function setStartEndForPaginator(currentPage, totalPages, nbPagesLinkToDisplay) {
    let start = 0
    let end = totalPages

    if (totalPages > nbPagesLinkToDisplay) {
        start = currentPage

        if (totalPages - currentPage < nbPagesLinkToDisplay) {
            start = totalPages - nbPagesLinkToDisplay
        }

        if (totalPages - start > nbPagesLinkToDisplay) {
            end = currentPage + nbPagesLinkToDisplay
        }
    }

    return [start, end]
}

function addHeadingForQuery(query, parentElement) {
    const searchHeading = document.createElement('h1')
    searchHeading.textContent = `Search results for “${query}”`
    parentElement.appendChild(searchHeading)
}

function addResultsList(hits, query, parentElement) {
    const searchResultsList = document.createElement('ul')
    searchResultsList.className = "search"
    for (hit of hits) {
        const hitElement = createHitElement(hit, query)
        searchResultsList.appendChild(hitElement)
    }
    parentElement.appendChild(searchResultsList)
}

function createHitElement(hitData, query) {
    const pageURL = new URL(hitData.url)
    pageURL.hash = '';
    pageURL.searchParams.set('highlight', query);
    const anchorURL = new URL(hitData.url);
    anchorURL.searchParams.set('highlight', query);
    const result = hitData._highlightResult

    const hitListElement = document.createElement('li')

    const hierarchies = Object.values(result.hierarchy);
    const firstHierarchyLevel = hierarchies[0];
    const lastHierarchyLevel = hierarchies[hierarchies.length - 1];

    const pageLink = document.createElement('a')
    hitListElement.appendChild(pageLink)
    pageLink.innerHTML = firstHierarchyLevel.value
    pageLink.href = pageURL

    const contextElement = document.createElement('div')
    hitListElement.appendChild(contextElement)
    contextElement.className = 'context'

    if (lastHierarchyLevel && lastHierarchyLevel !== firstHierarchyLevel ) {
        const contextLinkContainer = document.createElement('div')
        contextElement.appendChild(contextLinkContainer)
        const contextLink = document.createElement('a')
        contextLinkContainer.appendChild(contextLink)
        contextLink.innerHTML = lastHierarchyLevel.value
        contextLink.href = anchorURL
    }

    if (result.content) {
        const contentElement = document.createElement('div')
        contentElement.innerHTML = result.content.value
        contextElement.appendChild(contentElement)
    }

    return hitListElement
}

window.addEventListener('DOMContentLoaded', () => runSearchPageSearch(0));