function stringToDate(str) {
    const day = parseInt(str.slice(0, 2));
    const month = parseInt(str.slice(2, 4) - 1);
    const year = parseInt(str.slice(4, 6)) + 2000;
    return new Date(year, month, day);
}

function typeToClass(type) {
    const list = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    if(parseInt(type)>=0 && parseInt(type)<=3){
        return list[parseInt(type)];
    }
    else {
        return 'ECONOMY';
    }
}

module.exports = { typeToClass, stringToDate };