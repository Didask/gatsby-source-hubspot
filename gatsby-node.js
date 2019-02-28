const fetch = require('node-fetch')
const queryString = require('query-string')
const crypto = require('crypto')

exports.sourceNodes = async ({ boundActionCreators, createNodeId }, configOptions) => {
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
  const postsData = await fetch(POSTS_API_ENDPOINT).then(response => response.json())

  console.log(
    '\n  Fetching topics from: \x1b[33m%s\x1b[0m',
    `\n  ${TOPICS_API_ENDPOINT}\n`
  )
  const topicsData = await fetch(TOPICS_API_ENDPOINT).then(response => response.json())

  console.log(
    '\n  Fetching authors from: \x1b[33m%s\x1b[0m',
    `\n  ${AUTHORS_API_ENDPOINT}\n`
  )
  const authorsData = await fetch(AUTHORS_API_ENDPOINT).then(response => response.json())

  topicsData.objects.forEach(topic => { createNode(processTopic(topic)) })
  authorsData.objects.forEach(author => { createNode(processAuthor(author)) })

  postsData.objects.map(post => {
    return {
      id: post.id,
      title: post.title,
      body: post.post_body,
      state: post.state,
      author: post.blog_post_author
        ? authorsData.objects.filter(authorData => authorData.id === post.blog_post_author.id)[0]
        : null,
      featured_image: {
        url: post.featured_image,
        alt_text: post.featured_image_alt_text
      },
      meta: {
        title: post.page_title,
        description: post.meta_description,
        portalId: post.portal_id
      },
      summary: post.post_summary,
      published: post.publish_date,
      updated: post.updated,
      created: post.created,
      slug: post.slug,
      topics: post.topic_ids.map(topic_id => topicsData.objects.filter(topicData => topicData.id === topic_id)[0])
    }
  }).forEach(post => { createNode(processPost(post)) })

  return
}
