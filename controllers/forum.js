exports.getCategories = (req, res, next) => {
  res.status(200).json({
    categories: [{ title: 'main' }, { title: 'addition' }],
  });
};
