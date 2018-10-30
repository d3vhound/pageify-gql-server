const conversation = (sequelize, DataTypes) => {
	const Conversation = sequelize.define('conversation', {
		
	})

	Conversation.associate = models => {
		Conversation.belongsTo(models.User, { 
			as: 'sender',
			foreignKey: {
				name: 'senderId',
				allowNull: false
			} 
		})
		Conversation.belongsTo(models.User, {
			as: 'reciever',
			foreignKey: {
				name: 'receiverId',
				allowNull: false
			}  
		})
		Conversation.hasMany(models.Message)
	}

	// Conversation.findOrCreateConversation = function (senderId, receiverId, models, Op) {
	// 	return Conversation.find({
	// 		where: {
	// 			user1Id: {
	// 				[Op.or]: [senderId, receiverId]
	// 			},
	// 			user2Id: {
	// 				[Op.or]: [senderId, receiverId]
	// 			}
	// 		},
	// 		include: [ models.Message ],
	// 		order: [[ models.Message, 'createdAt', 'DESC' ]]
	// 	})
	// 	.then(conversation => {
	// 		if (conversation) {
	// 			return conversation
	// 		} else {
	// 			return Conversation.create({
	// 				user1Id: senderId,
	// 				user2Id: receiverId
	// 			}, {
	// 				include: [ models.message ],
	// 				order: [[ models.message, 'createdAt', 'DESC' ]]
	// 			})
	// 		}
	// 	})
	// }

	return Conversation
}

export default conversation;