type Reservation = {
  _id: string;
  startDate: string;
  endDate: string;
  userId: string;
  invoiceId: string;
};

describe('Reservations', () => {
  let jwt: string;

  beforeAll(async () => {
    const user = {
      email: 'test@test.com',
      password: 'StrongPassword123!@',
    };

    await fetch('http://auth:3001/users', {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await fetch('http://auth:3001/auth/login', {
      method: 'POST',
      body: JSON.stringify(user),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    jwt = await response.text();
  });

  test('should create and get a reservation', async () => {
    const responseCreate = await fetch(
      'http://reservations:3000/reservations',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authentication: jwt,
        },
        body: JSON.stringify({
          startDate: '12/20/2025',
          endDate: '12/25/2025',
          charge: {
            amount: 22,
            card: {
              cvc: '567',
              exp_month: 12,
              exp_year: 34,
              number: '4242424242424242',
            },
          },
        }),
      },
    );

    expect(responseCreate.ok).toBeTruthy();
    const createdReservation = (await responseCreate.json()) as Reservation;

    const responseGet = await fetch(
      `http://reservations:3000/reservations/${createdReservation._id}`,
      {
        headers: {
          Authentication: jwt,
        },
      },
    );

    const reservation = (await responseGet.json()) as Reservation;
    expect(createdReservation).toEqual(reservation);
  });
});
