const socket = io();

const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visableHeight = $messages.offsetHeight;

    const containerHeight = $messages.scrollHeight;

    const scrollOffset = $messages.scrollTop + visableHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createdAt: moment(locationMessage.createdAt).format('h:mm a')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    const userMessage = e.target.elements.message;

    socket.emit('sendMessage', userMessage.value, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();
    
        if (error) {
            return console.log(error);
        }

        console.log('message was delivered');
    });
});

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Your browser does not support geolocation, sorry!');
    }
    
    $sendLocationButton.setAttribute('disabled', 'disabled');
    
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longtitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Location shared! You were doxed! Congrats');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});