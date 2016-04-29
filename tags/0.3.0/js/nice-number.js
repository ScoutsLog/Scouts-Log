
function nice_number(n) {
    // Make sure we have a number
    n = parseInt(n, 10);

    // is this a number?
    if (isNaN(n)) return;

    // now filter it
    var v;
    var u;
        
    if (n >= 1000000000000) {
        v = (n / 1000000000000);
        v = v.toFixed(1);
        u = 'T';
    } else if (n >= 1000000000) {
        v = (n / 1000000000);
        v = v.toFixed(1);
        u = 'B';
    } else if (n >= 1000000) {
        v = (n / 1000000);
        v = v.toFixed(1);
        u = 'M';
    } else if (n >= 1000) {
        v = (n / 1000);
        v = v.toFixed(1);
        u = 'K';
    } else {
        v = n.toFixed(1);
        u = '';
    }
        
    var final = v + u;
        
    return final;
}
