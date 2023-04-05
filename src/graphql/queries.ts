import gql from 'graphql-tag';



export const MeQuery = gql`
    query meQuery {
        me {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
            membership
        }
    }`;

export const CheckMeQuery = gql`
    query checkMeQuery($platform: String!, $params: String!) {
        checkMe(platform: $platform, params: $params) {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            groceryList
            attributes {
               name
               value
            }
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
            membership
        }
    }`;

export const MeQuery2 = gql`
    query meQuery2 {
        me {
            id
            name
            photo
            email
            firstName
            lastName
            currentDate
            premium
            stat
            roles
            favorites
            currentChallenge
            attributes {
               name
               value
            }
            groceryList
            challenges {
               id
               title
               options
               thumbnail
               locked
               type
               isPlan
               isFeatured
               workoutsCount
               recipesCount
               days {
                  slug
                  title
                  items
               }
            }
            membership
        }
    }`;
