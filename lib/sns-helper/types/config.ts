type TopicConfig = {
	name: string
	fifoTopic?: boolean
	contentBasedDeduplication?: boolean
}

export type SNSConfig = {
	topic: TopicConfig
}
