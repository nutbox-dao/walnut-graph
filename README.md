## Walnut graph

The graph code for walnut of nutbox

### Config
Deploy nutbox contract first [nutbox]https://github.com/nutbox-dao/contract
Update the subgraph.yaml and /src/contracts.ts file with your depolyed contract

### Init
```bash
yarn
graph codegen && graph build
```


### Deploy
```bash
graph auth --product hosted-service [your-key]
graph deploy --product hosted-service [your-page]
```