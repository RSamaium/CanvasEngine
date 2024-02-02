import {loadYoga} from 'yoga-layout';

const Yoga = await loadYoga();
const root = Yoga.Node.create();
root.setWidth(500);
root.setHeight(300);

const secondChild = Yoga.Node.create();
secondChild.setWidth('100%');
secondChild.setHeight(100);
secondChild.setJustifyContent(Yoga.JUSTIFY_CENTER);
secondChild.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);


root.insertChild(secondChild, 0);


const node1 = Yoga.Node.create();
node1.setWidth('50%');
node1.setHeight(100);

const node2 = Yoga.Node.create();
node2.setWidth('50%');
node2.setHeight(100);

secondChild.insertChild(node1, 0);

root.calculateLayout();


secondChild.insertChild(node2, 1);

root.calculateLayout();

console.log(secondChild.getComputedLayout());
console.log(node1.getComputedLayout());
console.log(node2.getComputedLayout());
