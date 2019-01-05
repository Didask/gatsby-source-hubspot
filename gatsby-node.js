const fetch = require('node-fetch')
const queryString = require('query-string')
const crypto = require('crypto')

exports.sourceNodes = ({ boundActionCreators, createNodeId }, configOptions) => {
  const { createNode } = boundActionCreators

  delete configOptions.plugins

  const processPost = post => {
    const nodeId = createNodeId(`hubspot-post-${post.id}`)
    const nodeContent = JSON.stringify(post)
    const nodeContentDigest = crypto
      .createHash('md5')
      .update(nodeContent)
      .digest('hex')

    const nodeData = Object.assign({}, post, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `HubspotPost`,
        content: nodeContent,
        contentDigest: nodeContentDigest
      }
    })

    return nodeData
  }

  const processTopic = topic => {
    const nodeId = createNodeId(`hubspot-topic-${topic.id}`)
    const nodeContent = JSON.stringify(topic)
    const nodeContentDigest = crypto
      .createHash('md5')
      .update(nodeContent)
      .digest('hex')

    const nodeData = Object.assign({}, topic, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `HubspotTopic`,
        content: nodeContent,
        contentDigest: nodeContentDigest
      }
    })

    return nodeData
  }

  const processAuthor = author => {
    const nodeId = createNodeId(`hubspot-author-${author.id}`)
    const nodeContent = JSON.stringify(author)
    const nodeContentDigest = crypto
      .createHash('md5')
      .update(nodeContent)
      .digest('hex')

    const nodeData = Object.assign({}, author, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type: `HubspotAuthor`,
        content: nodeContent,
        contentDigest: nodeContentDigest
      }
    })

    return nodeData
  }

  const API_KEY = configOptions.key
  const filters = configOptions.filters
    ? queryString.stringify(configOptions.filters)
    : null
  const POSTS_API_ENDPOINT = `https://api.hubapi.com/content/api/v2/blog-posts?hapikey=${API_KEY}${
    filters ? '&' + filters : ''
  }`
  const TOPICS_API_ENDPOINT = `https://api.hubapi.com/blogs/v3/topics?hapikey=${API_KEY}`
  const AUTHORS_API_ENDPOINT = `https://api.hubapi.com/blogs/v3/blog-authors?hapikey=${API_KEY}`

  if (!API_KEY) throw new Error('No Hubspot API key provided')

  console.log(
    '\n  gatsby-source-hubspot\n  ------------------------- \n  Fetching posts from: \x1b[33m%s\x1b[0m',
    `\n  ${POSTS_API_ENDPOINT}\n`
  )

  fetch(POSTS_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
        console.log(
          '\n  Fetching topics from: \x1b[33m%s\x1b[0m',
          `\n  ${TOPICS_API_ENDPOINT}\n`
        )
          fetch(TOPICS_API_ENDPOINT)
        .then(response => response.json())
        .then(topicsData => {
          topicsData.objects.forEach(topic => {createNode(processTopic(topic))})
          const cleanData = data.objects.map(post => {
            return {
              id: post.id,
              title: post.title,
              body: post.post_body,
              state: post.state,
              author: post.blog_post_author
                ? {
                    id: post.blog_post_author.id,
                    avatar: post.blog_post_author.avatar,
                    name: post.blog_post_author.display_name,
                    full_name: post.blog_post_author.full_name,
                    bio: post.blog_post_author.bio,
                    email: post.blog_post_author.email,
                    facebook: post.blog_post_author.facebook,
                    google_plus: post.blog_post_author.google_plus,
                    linkedin: post.blog_post_author.linkedin,
                    twitter: post.blog_post_author.twitter,
                    twitter_username: post.blog_post_author.twitter_username,
                    website: post.blog_post_author.website,
                    slug: post.blog_post_author.slug
                  }
                : null,
              feature_image: {
                url: post.featured_image,
                alt_text: post.featured_image_alt_text
              },
              meta: {
                title: post.page_title,
                description: post.meta_description
              },
              summary: post.post_summary,
              published: post.publish_date,
              updated: post.updated,
              created: post.created,
              slug: post.slug,
              topics: post.topic_ids.map(topic_id => topicsData.objects.filter(topicData => topicData.id === topic_id)[0])
            }
          })
          cleanData.forEach(post => {
            const nodeData = processPost(post)
            createNode(nodeData)
          })
        })
    })

  console.log(
    '\n  Fetching authors from: \x1b[33m%s\x1b[0m',
    `\n  ${AUTHORS_API_ENDPOINT}\n`
  )
  fetch(AUTHORS_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
      data.objects.forEach(author => {createNode(processAuthor(author))})
    })
}
