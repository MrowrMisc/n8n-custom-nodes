# When to Use the Programmatic Pattern

The programmatic pattern is ideal when your node needs to do more than just send a static HTTP request.

Use this pattern when:
- You need to transform or validate input data
- You need to loop over items or handle pagination
- You need to make multiple requests per item
- You need to handle binary data
- You need to implement conditional logic or branching
- You need to support complex authentication flows
- You want to use helper utilities like `this.helpers.request`

Avoid this pattern if your node can be fully described using declarative routing—it’s more powerful, but also more complex.

## Complex Data Transformation Example

Here's when you'd choose programmatic over declarative - when you need complex data processing:

```ts
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const operation = this.getNodeParameter('operation', i) as string;
    const inputData = items[i].json;
    
    if (operation === 'processCustomers') {
      // Complex validation and transformation
      const customers = inputData.customers as any[];
      
      if (!Array.isArray(customers)) {
        throw new Error('Input must contain a customers array');
      }
      
      const processedCustomers = customers
        .filter(customer => customer.email && customer.status === 'active')
        .map(customer => ({
          id: customer.id,
          fullName: `${customer.firstName} ${customer.lastName}`.trim(),
          email: customer.email.toLowerCase(),
          totalOrders: customer.orders?.length || 0,
          lastOrderDate: customer.orders?.[0]?.date || null,
          tier: customer.orders?.length > 10 ? 'premium' : 'standard',
        }))
        .sort((a, b) => b.totalOrders - a.totalOrders);
      
      // Make API calls for each processed customer
      for (const customer of processedCustomers) {
        try {
          const enrichedData = await this.helpers.request({
            method: 'GET',
            url: `https://api.example.com/customers/${customer.id}/analytics`,
            json: true,
          });
          
          customer.analytics = enrichedData;
        } catch (error) {
          customer.analytics = null;
          console.warn(`Failed to enrich customer ${customer.id}:`, error.message);
        }
      }
      
      returnData.push({ json: { processedCustomers } });
    }
  }

  return [returnData];
}
```

This type of complex data processing, validation, and multiple API calls per item would be impossible with declarative routing alone.
