import * as Yup from 'yup';

import User from '../models/User';
import Barbershop from '../models/Barbershop';

import Rating from '../models/Rating';

class RatingController {
  async show(req, res) {
    const checkUserExists = await User.findByPk(req.userId);

    if (!checkUserExists) {
      return res.status(400).json({ error: 'User does not exists.' });
    }

    const checkRatingExists = await Rating.findByPk(req.params.id);

    if (!checkRatingExists) {
      return res.status(400).json({ error: 'Rating does not exists.' });
    }

    if (checkRatingExists.user_id !== checkUserExists.id) {
      return res
        .status(401)
        .json({ error: 'User is not the owner of the rating.' });
    }

    const rating = await Rating.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] },
    });

    return res.json(rating);
  }

  async index(req, res) {
    const checkUserExists = await User.findByPk(req.userId);

    if (!checkUserExists) {
      return res.status(400).json({ error: 'User does not exists.' });
    }

    const checkBarbershopExists = await Barbershop.findByPk(req.params.id);

    if (!checkBarbershopExists) {
      return res.status(400).json({ error: 'Barbershop does not exists.' });
    }

    const ratings = await Rating.findAll({
      where: { barbershop_id: req.params.id },
      attributes: ['id', 'grade'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    return res.json(ratings);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      barbershop_id: Yup.number()
        .integer()
        .required(),
      grade: Yup.number()
        .integer()
        .positive()
        .min(1)
        .max(5)
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findByPk(req.userId);

    if (!userExists) {
      return res.status(400).json({ error: 'User does not exists.' });
    }

    const barbershopExists = await Barbershop.findByPk(req.body.barbershop_id);

    if (!barbershopExists) {
      return res.status(400).json({ error: 'Barbershop does not exists.' });
    }

    const rating = await Rating.create({
      user_id: req.userId,
      barbershop_id: req.body.barbershop_id,
      grade: req.body.grade,
    });

    const numberOfGrades = await Rating.count({
      where: { barbershop_id: req.body.barbershop_id },
    });

    const sumOfGrades = await Rating.sum('grade', {
      where: { barbershop_id: req.body.barbershop_id },
    });

    const barbershopGrade = sumOfGrades / numberOfGrades;

    const roundGrade = parseFloat(barbershopGrade.toFixed(1));

    await barbershopExists.update({ grade: roundGrade });

    return res.json(rating);
  }
}

export default new RatingController();
