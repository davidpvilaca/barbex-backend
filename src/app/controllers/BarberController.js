import * as Yup from 'yup';

import Barber from '../models/Barber';

import User from '../models/User';
import Image from '../models/Image';
import Barbershop from '../models/Barbershop';

class BarberController {
  async store(req, res) {
    const schema = Yup.object().shape({
      user_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const userExists = await User.findByPk(req.body.user_id);

    if (!userExists) {
      return res.status(400).json({ error: 'User does not exists.' });
    }

    const userIsBarber = await Barber.findOne({
      where: { user_id: userExists.id },
    });

    if (userIsBarber) {
      return res.status(400).json({ error: 'User is already a barber.' });
    }

    const barbershopExists = await Barbershop.findByPk(req.params.barbershopId);

    if (!barbershopExists) {
      return res.status(400).json({ error: 'Barbershop does not exists.' });
    }

    const { id } = await Barber.create({
      user_id: req.body.user_id,
      barbershop_id: req.params.barbershopId,
    });

    const barber = await Barber.findByPk(id, {
      attributes: ['id'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: Image,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
        {
          model: Barbershop,
          as: 'barbershop',
          attributes: ['id', 'name'],
        },
      ],
    });

    await userExists.update({ barber: true });

    return res.json(barber);
  }

  async index(req, res) {
    const barbers = await Barber.findAll({
      attributes: [],
      where: { barbershop_id: req.params.barbershopId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'barber'],
          include: [
            {
              model: Image,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(barbers);
  }

  async delete(req, res) {
    const barber = await Barber.findOne({
      where: { user_id: req.params.barberId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!barber) {
      return res.status(400).json({ error: 'Barber does not exists.' });
    }

    const user = await User.findByPk(barber.user.id);

    // check if who's accessing the route is the owner of the barbershop
    await user.destroy();

    return res.send();
  }
}

export default new BarberController();
