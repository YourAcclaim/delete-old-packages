import { getOctokit } from "@actions/github"
import { Input, Package, QueryStrategy } from "../types"

// language=graphql
const query = `
  query getVersions($owner: String!, $repo: String!, $names: [String!]!) {
    repository(owner: $owner, name: $repo) {
      packages(first: 20, names: $names) {
        nodes {
          name
          versions(last: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              id
              version
            }
          }
        }
      }
    }
  }
`

type RepoResponse = {
  repository: {
    packages: {
      nodes: [
        {
          name: string
          versions: {
            nodes: [{ id: string; version: string }]
          }
        }
      ]
    }
  }
}

export default class RepoQueryStrategy implements QueryStrategy {
  async queryPackages(input: Input): Promise<Package[]> {
    const result = await getOctokit(input.token).graphql<RepoResponse>(query, {
      owner: input.owner,
      repo: input.repo,
      names: input.names,
      headers: {
        Accept: "application/vnd.github.package-deletes-preview+json",
      },
    })

    return result.repository.packages.nodes.map((pkg) => ({
      name: pkg.name,
      versions: pkg.versions.nodes.map((version) => ({ id: version.id, version: version.version })),
    }))
  }
}
