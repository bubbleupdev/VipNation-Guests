import gql from 'graphql-tag';

export const GetTourDateWithGuestsQuery = gql`
    query getTourDateWithGuestsQuery($instanceId: Int!, $rnd: Int!) {
        getTourDateWithGuests(instanceId: $instanceId, rnd: $rnd) {
            result
            error
            rnd
            data {
              instanceId
              name
              eventCity
              eventDate
              guests {
                 id
                 firstName
                 lastName
                 email
                 purchaserId
                 isCheckedIn
                 checkedAt
                 code
              }
              purchasers {
                 id
                 firstName
                 lastName
                 guestsCount
                 checkedInGuests
                 details
                 notes
              }
            }
        }
    }`;

export const GetNearTourDatesWithGuestsQuery = gql`
    query getNearTourDatesWithGuestsQuery {
        getNearTourDatesWithGuests {
            result
            error
            data {
              instanceId
              name
              eventCity
              eventDate
              guests {
                 id
                 firstName
                 lastName
                 email
                 purchaserId
                 isCheckedIn
                 checkedAt
                 code
              }
              purchasers {
                 id
                 firstName
                 lastName
                 guestsCount
                 checkedInGuests
                 details
                 notes
              }
            }
        }
    }`;

export const MeQuery = gql`
    query meQuery($rnd: Int!) {
        me(rnd: $rnd) {
            id
            name
            photo
            email
            firstName
            lastName
        }
    }`;

// export const CheckMeQuery = gql`
//     query checkMeQuery($platform: String!, $params: String!) {
//         checkMe(platform: $platform, params: $params) {
//             id
//             name
//             photo
//             email
//             firstName
//             lastName
//             currentDate
//             premium
//             stat
//             roles
//             favorites
//             currentChallenge
//             groceryList
//             attributes {
//                name
//                value
//             }
//             challenges {
//                id
//                title
//                options
//                thumbnail
//                locked
//                type
//                isPlan
//                isFeatured
//                workoutsCount
//                recipesCount
//                days {
//                   slug
//                   title
//                   items
//                }
//             }
//             membership
//         }
//     }`;
//
// export const MeQuery2 = gql`
//     query meQuery2 {
//         me {
//             id
//             name
//             photo
//             email
//             firstName
//             lastName
//             currentDate
//             premium
//             stat
//             roles
//             favorites
//             currentChallenge
//             attributes {
//                name
//                value
//             }
//             groceryList
//             challenges {
//                id
//                title
//                options
//                thumbnail
//                locked
//                type
//                isPlan
//                isFeatured
//                workoutsCount
//                recipesCount
//                days {
//                   slug
//                   title
//                   items
//                }
//             }
//             membership
//         }
//     }`;
