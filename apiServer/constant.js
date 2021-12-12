const fileTypes = {
    'C': '.c',
    'C++': '.cpp',
    'Java': '.java',
    'JavaScript(Node)': '.js',
    'Python2.7': '.py',
    'Python3': '.py'
}

const compileMapLanguageToCmd = {
    "C": " gcc app.c -o app.out",
    "C++": " g++ app.cpp -o app.out",
    "Java": " javac app.java"
}

const runLanguageToCmd = {
    "Python2.7": " python2.7 ./app.py ",
    "Python3": " python3 ./app.py ",
    "JavaScript(Node)": "nodejs ./app.js ",
    "C": "./app.out",
    "C++": "./app.out",
    "Java": 'java '
}
module.exports = { fileTypes, compileMapLanguageToCmd, runLanguageToCmd }