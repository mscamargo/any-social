// Format the rows were stored in while Sequelize owned the tables
// ('2019-07-19 15:25:39.000 +00:00'); kept so existing rows and new ones match.
export default (date = new Date()) =>
  date.toISOString().replace('T', ' ').replace('Z', ' +00:00')
