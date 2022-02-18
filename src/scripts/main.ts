import { isError, searchPhotos } from './api';

const $form = document.querySelector<HTMLFormElement>('.header-search-form');
if (!($form instanceof HTMLFormElement)) {
  throw new Error('$form not found');
}
const $input = $form.querySelector<HTMLInputElement>(
  '.header-search-form__input'
);
if (!($input instanceof HTMLInputElement)) {
  throw new Error('$input not found');
}
const $reset = $form.querySelector<HTMLButtonElement>(
  '.header-search-form__reset'
);
if (!($reset instanceof HTMLButtonElement)) {
  throw new Error('$reset not found');
}
const $submit = $form.querySelector<HTMLButtonElement>(
  '.header-search-form__submit'
);
if (!($submit instanceof HTMLButtonElement)) {
  throw new Error('$submit not found');
}

const $container = document.querySelector<HTMLDivElement>(
  '.main__container'
) as HTMLDivElement;
if (!($container instanceof HTMLDivElement)) {
  throw new Error('$container not found');
}

const $ratelimit = document.querySelector<HTMLSpanElement>(
  '.footer-api__ratelimit'
) as HTMLSpanElement;
if (!($ratelimit instanceof HTMLSpanElement)) {
  throw new Error('$ratelimit not found');
}

const IMAGE_WIDTH = 212;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image(IMAGE_WIDTH, IMAGE_WIDTH);
    image.onload = (): void => resolve(image);
    image.onerror = (): void => reject();
    image.src = src;
  });
}

function outputMessage(message: string | null): void {
  $container.innerHTML =
    typeof message === 'string'
      ? `<p class="main__message">${message}</p>`
      : '';
}

function outputImages(keyword: string): void {
  searchPhotos(keyword)
    .then((object) => {
      if (isError(object)) {
        outputMessage('Что-то пошло не так, попробуйте позже');
        console.error(object);
        return;
      }

      $ratelimit.textContent = `${object.ratelimit.remaining} / ${object.ratelimit.limit}`;

      if (object.results.length === 0) {
        outputMessage('Не найдено');
        return;
      }

      outputMessage('Загружаем');

      const promises: ReturnType<typeof loadImage>[] = [];
      object.results.forEach((result) => {
        promises.push(loadImage(`${result.urls.raw}&w=${IMAGE_WIDTH}&dpr=2`));
      });

      Promise.all(promises)
        .then(($images) => {
          $images.forEach(($image) => {
            $image.classList.add('main__image');
          });
          outputMessage(null);
          $container.append(...$images);
        })
        .catch((error) => {
          outputMessage('Что-то пошло не так, попробуйте позже');
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
}

const reset = {
  isHidden: $reset.classList.contains('header-search-form__reset_hidden'),

  hide(): void {
    $reset.classList.add('header-search-form__reset_hidden');
    $reset.setAttribute('aria-hidden', 'true');
    this.isHidden = true;
  },

  show(): void {
    $reset.classList.remove('header-search-form__reset_hidden');
    $reset.removeAttribute('aria-hidden');
    this.isHidden = false;
  },
};

let previousValue = '';
$form.addEventListener('submit', (event) => {
  event.preventDefault();
  const trimmedValue = $input.value.trim();
  if (trimmedValue.length > 0 && trimmedValue !== previousValue) {
    previousValue = trimmedValue;
    outputImages(trimmedValue);
  }
});

$input.addEventListener('input', () => {
  if ($input.value.length > 0) {
    if (reset.isHidden) {
      reset.show();
    }
  } else {
    reset.hide();
  }
});

$reset.addEventListener('click', () => {
  $input.focus();
  reset.hide();
});

$submit.addEventListener('click', () => {
  $input.focus();
});

outputImages($input.placeholder.length > 0 ? $input.placeholder : 'frontend');
