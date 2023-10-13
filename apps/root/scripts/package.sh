
DIR=$(dirname $0)

cd $DIR/..
rm -rf dist
mkdir -p dist

cp -r views dist/
cp -r assets dist/
cp index.js dist/
