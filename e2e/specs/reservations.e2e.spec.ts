describe('Reservations', () => {
  beforeAll(async () => {
    const user = {
      email: 'test@test.com',
      password: 'StrongPassword123!@',
    };

    await fetch('http://auth:3001', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  });

  test('should create a reservation', async () => {
    const response = await fetch('http://reservations:3000', {
      method: 'POST',
      body: JSON.stringify({
        startDate: new Date(),
        endDate: new Date(),
      }),
    });
  });
});
