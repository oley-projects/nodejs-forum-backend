exports.getCategories = (req, res, next) => {
  res.status(200).json({
    categories: [
      { id: 1, name: 'main' },
      { id: 2, name: 'addition' },
    ],
  });
};

exports.getTopics = (req, res, next) => {
  res.status(200).json({
    topics: [
      {
        id: 1,
        name: 'Topic 1',
        description: '',
        createdUser: 'User',
        createdAt: new Date().toLocaleString(),
        replies: '3',
        views: '12',
        lastPostUser: 'User 1',
        lastPostCreatedAt: new Date().toLocaleString(),
      },
      {
        id: 2,
        name: 'Topic 2',
        description: 'Topic Description',
        createdUser: 'User2',
        createdAt: new Date().toLocaleString(),
        replies: '2',
        views: '21',
        lastPostUser: 'User',
        lastPostCreatedAt: new Date().toLocaleString(),
      },
    ],
  });
};

exports.createTopic = (req, res, next) => {
  const name = req.body.name;
  const description = req.body.description;
  res.status(201).json({
    message: 'Topic created!',
    topic: {
      id: new Date().getTime(),
      name,
      description,
      createdUser: 'User',
      createdAt: new Date().toLocaleString(),
      replies: '0',
      views: '0',
      lastPostUser: 'User',
      lastPostCreatedAt: new Date().toLocaleString(),
    },
  });
};
