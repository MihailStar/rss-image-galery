const HTTP_RESPONSE_STATUS_CODES = { OK: 200 } as const;

const API_URL =
  'https://api.unsplash.com/search/photos?query=%22{{keyword}}%22&per_page=30';
const API_KEY = 'dX0Qn2MaEGCe_7RrCprje0XLq-DJ2rTzC-osfZJg55k';

type Data = {
  status: typeof HTTP_RESPONSE_STATUS_CODES.OK;
  results: { urls: { raw: string; thumb: string } }[];
  ratelimit: { limit: number; remaining: number };
};

type Error = {
  status: number;
  errors: string[];
};

function isData(object: Data | Error): object is Data {
  return object.status === HTTP_RESPONSE_STATUS_CODES.OK;
}

function isError(object: Data | Error): object is Error {
  return object.status !== HTTP_RESPONSE_STATUS_CODES.OK;
}

async function searchPhotos(keyword: string): Promise<Data | Error> {
  const response = await fetch(API_URL.replace('{{keyword}}', keyword), {
    headers: {
      Authorization: `Client-ID ${API_KEY}`,
    },
  });

  if (response.status === HTTP_RESPONSE_STATUS_CODES.OK) {
    return {
      status: response.status,
      results: (
        (await response.json()) as {
          total: number;
          total_pages: number;
          results: Data['results'];
        }
      ).results,
      ratelimit: {
        limit: Number(response.headers.get('X-Ratelimit-Limit')),
        remaining: Number(response.headers.get('X-Ratelimit-Remaining')),
      },
    };
  }

  return {
    status: response.status,
    errors: (
      (await response.json()) as {
        errors: Error['errors'];
      }
    ).errors,
  };
}

export { isData, isError, searchPhotos };
