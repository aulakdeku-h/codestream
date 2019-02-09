// provides a message queue client to the API server,
// using SQS or RabbitMQ, as needed

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module');
const RabbitMQClient = require(process.env.CS_API_TOP +'/server_utils/rabbitmq');

class Queuer extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the desired AWS services
		return async () => {
			if (this.api.config.api.queueService !== 'rabbitmq') {
				return {};
			}
			this.api.log('Initiating RabbitMQ connection...');
			try {
				const { user, password, host, port } = this.api.config.rabbitmq;
				const config = {
					host: `amqp://${user}:${password}@${host}:${port}`,
					logger: this.api,
					isPublisher: true
				};
				this.rabbitmq = new RabbitMQClient(config);
				await this.rabbitmq.init();
			}
			catch (error) {
				this.api.error('Unable to initiate RabbitMQ connection: ' + error.message);
				return;
			}
			return { queueService: this.rabbitmq };
		};
	}
}

module.exports = Queuer;
