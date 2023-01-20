# SchoolManuelReaderToPDF

Input a school manual reader, output a pdf.

## Actually supported reader

-  `demo.educadhoc.fr`
- More coming soon !

## Requirement

- Node 16 or higher (Tested with node V19)
- Npm
- Internet connection (obviously)

## Installation

Install the project with npm:

```bash
  npm install
```
    
## Configuration

You can edit the following settings in the `config.js` file:
```js
module.exports = {
    quality: 2, // Higher number gets better quality but also bigger files !
    headless: true //  Control if it shows or not the browser. True = no browser. (Should be true for server or panel things !)
}
```    

## Run the program

To run this project do:

```bash
  node .
```


## Authors

- [@quentin72000](https://www.github.com/quentin72000)

