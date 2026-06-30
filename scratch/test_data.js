const url = 'http://192.168.0.118:8055/items/atendimentos?fields=id,data_abertura,status&limit=20';
const token = '3KxIvos0TAY__HSiJJmRX-_EJG1HCmZk';

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(json => {
  console.log('Result:', JSON.stringify(json, null, 2));
})
.catch(err => {
  console.error('Error:', err);
});
