import {test, expect, APIResponse, APIRequestContext} from "@playwright/test";
/*
    resource: https://restful-booker.herokuapp.com/apidoc/
    run: npx playwright test api.spec.ts --workers=1
*/
const baseUrl: string = 'https://restful-booker.herokuapp.com';

let token: string = '';
let headersWithToken: any;

async function getBookingIds(request: APIRequestContext): Promise<any> {
    let response: APIResponse = await request.get(`${baseUrl}/booking`);
    expect(response.ok()).toBeTruthy();

    return await response.json();
}

async function getFirstBookingId(request: APIRequestContext): Promise<number> {
    const bookingIds: any = await getBookingIds(request);

    return bookingIds[0].bookingid;
}

async function getBookingById(request: APIRequestContext, bookingId: number): Promise<any> {
    console.log(`Get a booking with id: ${bookingId}`);
    let response: APIResponse = await request.get(`${baseUrl}/booking/${bookingId}`);
    expect(response.ok()).toBeTruthy();

    const bookingDetails: any = await response.json();
    console.log(`Details of the booking:\n${JSON.stringify(bookingDetails)}`)

    return bookingDetails;
}

test.beforeEach(async ({ request }): Promise<void> => {
    if (token) {
        return;
    }

    const payload: any = {
        'username': 'admin',
        'password': 'password123'
    };
    const response: APIResponse = await request.post(`${baseUrl}/auth`, {
        data: payload
    });

    expect(response.ok()).toBeTruthy();

    const responseData: any = await response.json();
    token = responseData.token;
    headersWithToken = {
        'Accept': 'application/json',
        'Cookie': `token=${token}`,
    };
});

test('Ping - Healthcheck', async ({ request }): Promise<void> => {
    const response: APIResponse = await request.get(`${baseUrl}/ping`);
    expect(response.ok()).toBeTruthy();
});

test('Auth - Create token', async (): Promise<void> => {
    console.log(`Token received: ${token}`);
    expect(token).not.toBe('');
});

test('Booking - Get booking Ids', async ({ request }): Promise<void> => {
    const data: any = await getBookingIds(request);
    console.log(`There are ${data.length} bookings`);
});

test('Booking - Get non-existing booking', async ({ request }): Promise<void> => {
    const response: APIResponse = await request.get(`${baseUrl}/booking/99999999`);
    expect(response.status()).toBe(404);
});

test('Booking - Get details of a booking and filter bookings by parameters', async ({ request }): Promise<void> => {
    const bookingIdForLooking: number = await getFirstBookingId(request);
    const bookingDetails: any = await getBookingById(request, bookingIdForLooking);

    console.log(`Get the booking by firstname: ${bookingDetails.firstname}`);
    let response: APIResponse = await request.get(`${baseUrl}/booking?firstname=${bookingDetails.firstname}`);
    expect(response.ok()).toBeTruthy();
    let bookings: any = await response.json();
    console.log(`There are ${bookings.length} booking(s)`);
    let hasBookingId1: boolean = bookings.some((item => item.bookingid === bookingIdForLooking));
    expect(hasBookingId1, `A booking with number ${bookingIdForLooking} is missing`).toBe(true);

    console.log(`Get the booking by lastname: ${bookingDetails.lastname}`);
    response = await request.get(`${baseUrl}/booking?lastname=${bookingDetails.lastname}`);
    expect(response.ok()).toBeTruthy();
    bookings = await response.json();
    console.log(`There are ${bookings.length} booking(s)`);
    hasBookingId1 = bookings.some((item => item.bookingid === bookingIdForLooking));
    expect(hasBookingId1, `A booking with number ${bookingIdForLooking} is missing`).toBe(true);
});

test('Booking - Create a new one', async ({ request }): Promise<void> => {
    const newBooking: any = {
        'firstname': 'Jim',
        'lastname': 'Brown',
        'totalprice': 111,
        'depositpaid': true,
        'bookingdates': {
            'checkin': '2025-01-01',
            'checkout': '2025-01-03'
        },
        'additionalneeds': 'Breakfast'
    };
    const response: APIResponse = await request.post(`${baseUrl}/booking`, {
        data: newBooking
    });

    expect(response.ok()).toBeTruthy();

    const data: any = await response.json();

    console.log(`Response: ${JSON.stringify(data)}`);
    expect(data.bookingid).toBeGreaterThan(0);
    const expectedBooking = {
        'bookingid': data.bookingid,
        'booking': newBooking
    }
    console.log(`Expected booking: ${JSON.stringify(expectedBooking)}`);
    expect(data).toStrictEqual(expectedBooking);
});

test('Booking - Update the booking fully', async ({ request }): Promise<void> => {
    const bookingIdForLooking: number = await getFirstBookingId(request);
    const bookingDetails: any = await getBookingById(request, bookingIdForLooking);

    bookingDetails.firstname = 'John';
    bookingDetails.lastname = 'Smith';
    bookingDetails.additionalneeds = 'ganjubas';
    console.log(`The booking will be updated as:\n${JSON.stringify(bookingDetails)}`)

    let response: APIResponse = await request.put(`${baseUrl}/booking/${bookingIdForLooking}`, {
        headers: headersWithToken,
        data: bookingDetails
    });
    expect(response.ok()).toBeTruthy();
    const bookingUpdated: any = await response.json();
    console.log(`Response:\n${JSON.stringify(bookingUpdated)}`);
    expect(bookingDetails).toStrictEqual(bookingUpdated);
    console.log('The booking is updated fully');
});

test('Booking - Update the booking partially', async ({ request }): Promise<void> => {
    const bookingIdForLooking: number = await getFirstBookingId(request);
    const bookingDetails: any = await getBookingById(request, bookingIdForLooking);

    bookingDetails.firstname = 'John';
    bookingDetails.lastname = 'Smith';

    let response: APIResponse = await request.patch(`${baseUrl}/booking/${bookingIdForLooking}`, {
        headers: headersWithToken,
        data: {
            'firstname': bookingDetails.firstname,
            'lastname': bookingDetails.lastname
        },
    });
    expect(response.ok()).toBeTruthy();
    const bookingUpdated: any = await response.json();
    console.log(`Response:\n${JSON.stringify(bookingUpdated)}`);
    expect(bookingDetails).toStrictEqual(bookingUpdated);
    console.log('The booking is updated partially');
});

test('Booking - Delete the booking', async ({ request }): Promise<void> => {
    const bookingIdForLooking: number = await getFirstBookingId(request);

    console.log(`A booking with [${bookingIdForLooking}] id will be deleted`);

    let response: APIResponse = await request.delete(`${baseUrl}/booking/${bookingIdForLooking}`, {
        headers: headersWithToken
    });
    expect(response.ok()).toBeTruthy();

    response = await request.get(`${baseUrl}/booking/${bookingIdForLooking}`);
    expect(response.status()).toBe(404);
    console.log('The booking is deleted successfully');
});
