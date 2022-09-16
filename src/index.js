import axios from 'axios';
import Notify from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const API_KEY = '29743747-4d974b8d370b5a5c48adadad9';
const URL = 'https://pixabay.com/api/';
const gallery = document.querySelector('.gallery');
const btnLoadMore = document.querySelector('.load-more');
const searchForm = document.querySelector('#search-form');

searchForm.addEventListener('submit', onSearch);
btnLoadMore.addEventListener('click', onBtnLoadMore);

class ApiService {
  constructor() {
    this.searchQuery = '';
    this.page = 1;
    this.hits = 0;
    this.totalHits = 0;
  }

  async fetchImage() {
    try {
      const options = {
        params: {
          key: API_KEY,
          q: this.searchQuery,
          image_type: 'photo',
          orientation: 'horizontal',
          safesearch: true,
          page: this.page,
          per_page: 40,
        },
      };
      const url = `${URL}`;
      const response = await axios.get(url, options);
      const data = await response.data;

      this.page += 1;
      this.totalHits = response.data.totalHits;

      return data;
    } catch (error) {
      console.log('~ error', error);
    }
  }

  set query(newQuery) {
    this.searchQuery = newQuery;
  }
}

const imageApiService = new ApiService();

async function onSearch(evt) {
  try {
    evt.preventDefault();
    cleanGallery();

    const searchQuery = evt.currentTarget.elements.searchQuery.value.trim();

    if (!searchQuery) {
      Notify.Notify.warning('Please type something to search.');

      isHiddenBtnLoadMore();

      return;
    }

    imageApiService.query = searchQuery;
    imageApiService.page = 1;
    imageApiService.hits = 0;

    evt.currentTarget.reset();
    const data = await imageApiService.fetchImage();
    if (data.hits.length == 0) {
      Notify.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );

      isHiddenBtnLoadMore();

      return;
    }

    renderPhotoCard(data);
    visibleBtnLoadMore();
    btnLoadMore.disabled = false;

    Notify.Notify.success(`Hooray! We found ${data.totalHits} images.`);
  } catch (error) {
    console.log('~ error', error);
  }
}

function cleanGallery() {
  gallery.innerHTML = '';
}

function visibleBtnLoadMore() {
  btnLoadMore.classList.remove('is-hidden');
  btnLoadMore.classList.add('visible');
}

function isHiddenBtnLoadMore() {
  btnLoadMore.classList.add('is-hidden');
  btnLoadMore.classList.remove('visible');
}

async function onBtnLoadMore() {
  try {
    const data = await imageApiService.fetchImage();
    if (data.hits.length == 0) {
      Notify.Notify.info(
        "We're sorry, but you've reached the end of search results."
      );
      btnLoadMore.disabled = true;
      return;
    }
    if (imageApiService.hits > imageApiService.totalHits) {
      Notify.Notify.info(
        "We're sorry, but you've reached the end of search results."
      );
      btnLoadMore.disabled = true;
      return;
    }
    renderPhotoCard(data);
    pageScrolling();

    imageApiService.hits += 40;
  } catch (error) {
    console.log('~ error', error);
  }
}

function pageScrolling() {
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}
function renderPhotoCard(data) {
  const results = data.hits;
  const stringTag = results
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<div class="photo-card"> <a href="${largeImageURL}">
        <img src="${webformatURL}" alt="${tags}" loading="lazy" />
        <div class="info">
        <p class="info-item">
            <b>Likes</b> ${likes}
        </p>
        <p class="info-item">
            <b>Views</b> ${views}
        </p>
        <p class="info-item">
            <b>Comments</b> ${comments}
        </p>
        <p class="info-item">
            <b>Downloads</b> ${downloads}
        </p>
        </div></a>
    </div>`;
      }
    )
    .join('');

  gallery.insertAdjacentHTML('beforeend', stringTag);

  new SimpleLightbox('.photo-card a', {
    captionsData: 'alt',
    captionDelay: 250,
  });
}
