/**
 * Fragment "léger" utilisé pour les listes (recherche, rangées d'accueil,
 * calendrier) : pas de planning d'épisodes imbriqué (coûteux à grande
 * échelle). Réservé à la fiche détaillée : MEDIA_DETAIL_FRAGMENT ci-dessous.
 */
export const MEDIA_FRAGMENT = /* GraphQL */ `
  fragment MediaFields on Media {
    id
    type
    format
    status
    season
    seasonYear
    episodes
    chapters
    duration
    genres
    averageScore
    popularity
    studios(isMain: true) {
      nodes {
        name
      }
    }
    coverImage {
      extraLarge
      large
      color
    }
    bannerImage
    title {
      romaji
      english
      native
    }
    description(asHtml: false)
    nextAiringEpisode {
      airingAt
      episode
    }
    externalLinks {
      url
      site
      type
      language
      isDisabled
    }
  }
`;

export const MEDIA_DETAIL_FRAGMENT = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  fragment MediaDetailFields on Media {
    ...MediaFields
    episodeSchedule: airingSchedule(perPage: 50, page: 1) {
      nodes {
        airingAt
        episode
      }
    }
  }
`;

export const SEARCH_MEDIA_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query SearchMedia($search: String!, $type: MediaType!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: $type, sort: SEARCH_MATCH, isAdult: false) {
        ...MediaFields
      }
    }
  }
`;

export const MEDIA_BY_ID_QUERY = /* GraphQL */ `
  ${MEDIA_DETAIL_FRAGMENT}
  query MediaById($id: Int!) {
    Media(id: $id) {
      ...MediaDetailFields
    }
  }
`;

export const SEASON_POPULAR_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query SeasonPopular($season: MediaSeason!, $seasonYear: Int!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(
        season: $season
        seasonYear: $seasonYear
        type: ANIME
        sort: POPULARITY_DESC
        isAdult: false
      ) {
        ...MediaFields
      }
    }
  }
`;

export const CLASSICS_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query Classics($type: MediaType!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: $type, status: FINISHED, startDate_lesser: 20000101, sort: SCORE_DESC, isAdult: false) {
        ...MediaFields
      }
    }
  }
`;

export const POPULAR_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query Popular($type: MediaType!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      media(type: $type, sort: POPULARITY_DESC, isAdult: false) {
        ...MediaFields
      }
    }
  }
`;

export const AIRING_THIS_WEEK_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query AiringThisWeek($start: Int!, $end: Int!, $perPage: Int!) {
    Page(page: 1, perPage: $perPage) {
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        airingAt
        episode
        media {
          ...MediaFields
        }
      }
    }
  }
`;

export const POPULAR_RELEASING_IDS_QUERY = /* GraphQL */ `
  query PopularReleasingIds($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
        id
      }
    }
  }
`;

export const AIRING_BY_MEDIA_QUERY = /* GraphQL */ `
  ${MEDIA_FRAGMENT}
  query AiringByMedia($ids: [Int], $start: Int, $end: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      airingSchedules(mediaId_in: $ids, airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        airingAt
        episode
        media {
          ...MediaFields
        }
      }
    }
  }
`;
