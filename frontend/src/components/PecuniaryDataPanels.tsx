import { Tabs } from '@mantine/core';

const PecuniaryDataPanels = () => {
  return (
    <Tabs defaultValue="income" mt="xl">
      <Tabs.List>
        <Tabs.Tab value="income">Income</Tabs.Tab>
        <Tabs.Tab value="fixed-expenses">Fixed expenses</Tabs.Tab>
        <Tabs.Tab value="actual-expenses">Actual expenses</Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="income" pt="md">
        <p>Income content will go here</p>
      </Tabs.Panel>

      <Tabs.Panel value="fixed-expenses" pt="md">
        <p>Fixed expenses content will go here</p>
      </Tabs.Panel>

      <Tabs.Panel value="actual-expenses" pt="md">
        <p>Actual expenses content will go here</p>
      </Tabs.Panel>
    </Tabs>
  );
};

export default PecuniaryDataPanels;

